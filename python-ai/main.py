"""
CVH — Microservice IA Python
FastAPI + PyTorch + scikit-learn
Port : 5001 (pour ne pas conflicorer avec Next.js sur 3000-3003)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn
import logging

from model import model_manager, CATEGORIES, PRIORITIES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cvh-ai")

app = FastAPI(
    title="CVH — Microservice IA",
    description="Analyse des compétences par réseau de neurones PyTorch",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001",
                   "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schémas Pydantic ─────────────────────────────────────────────────────────

class CompetenceProfile(BaseModel):
    """Profil de compétences brut (scores 0-1)"""
    score_technique:       float = Field(0.5, ge=0, le=1)
    score_communication:   float = Field(0.5, ge=0, le=1)
    score_leadership:      float = Field(0.5, ge=0, le=1)
    score_organisation:    float = Field(0.5, ge=0, le=1)
    score_creativite:      float = Field(0.5, ge=0, le=1)
    score_analytique:      float = Field(0.5, ge=0, le=1)
    annees_experience:     float = Field(0.0, ge=0)
    nb_objectifs_completes: float = Field(0.0, ge=0)

class SWOTInput(BaseModel):
    """Résultat SWOT issu de l'analyse Claude API"""
    strengths:    list[str] = Field(default_factory=list)
    weaknesses:   list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    threats:      list[str] = Field(default_factory=list)
    match_score:  Optional[int] = Field(None, ge=0, le=100)
    user_name:    str = "Collaborateur"
    annees_experience: float = Field(0.0, ge=0)
    nb_objectifs_completes: float = Field(0.0, ge=0)

class PredictionResponse(BaseModel):
    recommended_category: str
    confidence: float
    distribution: dict[str, float]
    competence_scores: dict[str, float]
    action_priorities: list[dict]
    interpretation: str

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": "CompetenceNet", "categories": CATEGORIES}


@app.post("/predict/profile", response_model=PredictionResponse)
def predict_from_profile(profile: CompetenceProfile):
    """
    Prédit la catégorie d'objectif depuis des scores de compétences directs.
    """
    try:
        features = profile.model_dump()
        result = model_manager.predict(features)
        interpretation = _generate_interpretation(result, features)
        action_priorities = _build_action_priorities(result["distribution"], features)

        return PredictionResponse(
            **result,
            competence_scores={
                k: v for k, v in features.items()
                if k.startswith("score_")
            },
            action_priorities=action_priorities,
            interpretation=interpretation,
        )
    except Exception as e:
        logger.error(f"Erreur predict_from_profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/swot", response_model=PredictionResponse)
def predict_from_swot(swot: SWOTInput):
    """
    Analyse un résultat SWOT (issu de Claude) pour extraire des scores
    et prédire la catégorie d'objectif prioritaire via PyTorch.
    """
    try:
        # Extraction des scores depuis les mots-clés SWOT
        competence_scores = model_manager.score_profile(
            swot.strengths, swot.weaknesses
        )
        features = {
            **competence_scores,
            "annees_experience": swot.annees_experience,
            "nb_objectifs_completes": swot.nb_objectifs_completes,
        }

        result = model_manager.predict(features)
        interpretation = _generate_interpretation(result, features, swot.user_name, swot.match_score)
        action_priorities = _build_action_priorities(result["distribution"], features)

        logger.info(
            f"SWOT predict → {result['recommended_category']} "
            f"({result['confidence']:.1f}%) pour {swot.user_name}"
        )

        return PredictionResponse(
            **result,
            competence_scores=competence_scores,
            action_priorities=action_priorities,
            interpretation=interpretation,
        )
    except Exception as e:
        logger.error(f"Erreur predict_from_swot: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/competences")
def analyze_competences(profile: CompetenceProfile):
    """
    Analyse complète : gaps, forces, axes de progression.
    Retourne un rapport détaillé par compétence.
    """
    features = profile.model_dump()
    scores = {k: v for k, v in features.items() if k.startswith("score_")}

    LABELS = {
        "score_technique":      "Compétences techniques",
        "score_communication":  "Communication",
        "score_leadership":     "Leadership",
        "score_organisation":   "Organisation",
        "score_creativite":     "Créativité",
        "score_analytique":     "Analytique",
    }

    sorted_scores = sorted(scores.items(), key=lambda x: x[1])
    gaps = [
        {
            "competence": LABELS.get(k, k),
            "niveau_actuel": round(v * 100),
            "niveau_cible": 80,
            "gap": round((0.8 - v) * 100),
            "priorite": "CRITICAL" if v < 0.3 else "HIGH" if v < 0.5 else "MEDIUM",
        }
        for k, v in sorted_scores if v < 0.8
    ]

    return {
        "scores": {LABELS.get(k, k): round(v * 100) for k, v in scores.items()},
        "gaps": gaps,
        "nb_competences_maitrisees": sum(1 for v in scores.values() if v >= 0.8),
        "score_global": round(sum(scores.values()) / len(scores) * 100),
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _generate_interpretation(
    result: dict,
    features: dict,
    user_name: str = "Collaborateur",
    match_score: int | None = None,
) -> str:
    cat = result["recommended_category"]
    conf = result["confidence"]
    score_str = f" (adéquation au poste : {match_score}%)" if match_score else ""

    messages = {
        "SKILLS":        f"{user_name}, le modèle identifie un axe prioritaire sur le développement des compétences techniques{score_str}. Avec {conf:.0f}% de confiance, un plan centré sur l'acquisition de nouvelles expertises est recommandé.",
        "LEADERSHIP":    f"{user_name} présente un profil à fort potentiel de leadership{score_str}. Le modèle recommande ({conf:.0f}%) un développement des compétences managériales et d'influence.",
        "PERFORMANCE":   f"L'analyse du profil de {user_name} indique un levier de performance opérationnelle{score_str}. Objectifs SMART et indicateurs de résultat sont prioritaires ({conf:.0f}%).",
        "WELLBEING":     f"Le modèle détecte chez {user_name} un besoin d'équilibre et de bien-être professionnel{score_str}. Des actions sur la gestion du stress et l'équilibre vie pro/perso sont recommandées ({conf:.0f}%).",
        "CAREER":        f"{user_name} est à un carrefour de carrière stratégique{score_str}. Le modèle recommande ({conf:.0f}%) de prioriser la planification de parcours et les opportunités de mobilité.",
        "COLLABORATION": f"Le profil de {user_name} bénéficierait d'un renforcement des compétences collaboratives{score_str}. Travail en équipe, communication transversale et co-création sont les axes prioritaires ({conf:.0f}%).",
    }
    return messages.get(cat, f"Catégorie recommandée : {cat} ({conf:.0f}% de confiance).")


def _build_action_priorities(distribution: dict, features: dict) -> list[dict]:
    """Construit une liste d'actions priorisées depuis la distribution de probabilités."""
    ACTION_MAP = {
        "SKILLS":        "Suivre une formation certifiante dans votre domaine d'expertise",
        "LEADERSHIP":    "Participer à un programme de développement du leadership",
        "PERFORMANCE":   "Définir des OKR clairs et mettre en place un tableau de bord de suivi",
        "WELLBEING":     "Mettre en place une routine bien-être et des pauses régulières",
        "CAREER":        "Planifier un entretien de carrière avec votre manager",
        "COLLABORATION": "Rejoindre un projet transversal ou animer un atelier d'équipe",
    }

    sorted_cats = sorted(distribution.items(), key=lambda x: x[1], reverse=True)
    return [
        {
            "rang": i + 1,
            "categorie": cat,
            "score": pct,
            "action": ACTION_MAP.get(cat, ""),
            "priorite": "HIGH" if i < 2 else "MEDIUM" if i < 4 else "LOW",
        }
        for i, (cat, pct) in enumerate(sorted_cats)
    ]


# ─── Entrée principale ────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=False, log_level="info")
