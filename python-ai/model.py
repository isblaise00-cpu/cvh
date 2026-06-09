"""
CVH — Modèle PyTorch d'analyse des compétences
Prédit le meilleur objectif de développement pour un profil donné
"""

import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import LabelEncoder, StandardScaler
import numpy as np
import os
import json

# ─── Catégories gérées par le modèle ──────────────────────────────────────────

CATEGORIES = ["SKILLS", "LEADERSHIP", "PERFORMANCE", "WELLBEING", "CAREER", "COLLABORATION"]
PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# ─── Architecture du réseau de neurones ───────────────────────────────────────

class CompetenceNet(nn.Module):
    """
    Réseau feed-forward pour la recommandation de catégorie d'objectif.
    Entrée  : vecteur de compétences normalisé (n features)
    Sortie  : distribution de probabilité sur les 6 catégories CVH
    """
    def __init__(self, input_size: int, hidden_size: int = 64, output_size: int = len(CATEGORIES)):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.LayerNorm(hidden_size),   # LayerNorm fonctionne avec batch_size=1
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


# ─── Gestionnaire du modèle ───────────────────────────────────────────────────

class CVHModelManager:
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "cvh_model.pt")
    FEATURES = [
        "score_technique",
        "score_communication",
        "score_leadership",
        "score_organisation",
        "score_creativite",
        "score_analytique",
        "annees_experience",
        "nb_objectifs_completes",
    ]

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.label_encoder.fit(CATEGORIES)
        self.model: CompetenceNet | None = None
        self._build_synthetic_dataset()
        self._train()

    def _build_synthetic_dataset(self):
        """
        Données synthétiques d'entraînement.
        En production : remplacer par les vraies données de la base PostgreSQL.
        """
        np.random.seed(42)
        n = 400

        self.X_train = np.random.rand(n, len(self.FEATURES)).astype(np.float32)
        # Règles métier encodées dans les labels :
        # fort score technique → SKILLS
        # fort score leadership → LEADERSHIP
        # etc.
        labels = []
        for row in self.X_train:
            scores = {
                "SKILLS":        row[0] * 0.5 + row[5] * 0.5,
                "LEADERSHIP":    row[2] * 0.7 + row[1] * 0.3,
                "PERFORMANCE":   row[3] * 0.5 + row[6] * 0.5,
                "WELLBEING":     row[7] * 0.6 + row[4] * 0.4,
                "CAREER":        row[6] * 0.5 + row[0] * 0.5,
                "COLLABORATION": row[1] * 0.6 + row[2] * 0.4,
            }
            labels.append(max(scores, key=scores.get))
        self.y_train = np.array(labels)

    def _train(self):
        X_scaled = self.scaler.fit_transform(self.X_train)
        y_encoded = self.label_encoder.transform(self.y_train)

        X_tensor = torch.tensor(X_scaled, dtype=torch.float32)
        y_tensor = torch.tensor(y_encoded, dtype=torch.long)

        self.model = CompetenceNet(input_size=len(self.FEATURES))
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=0.01, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.5)

        self.model.train()
        for epoch in range(120):
            optimizer.zero_grad()
            outputs = self.model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            scheduler.step()
            if (epoch + 1) % 40 == 0:
                print(f"  Epoch {epoch+1}/120 - Loss: {loss.item():.4f}")

        self.model.eval()
        print("[OK] Modele CVH entraine")

    def predict(self, features: dict) -> dict:
        """
        Prédit la catégorie d'objectif prioritaire et les probabilités par catégorie.
        """
        row = np.array([[
            features.get("score_technique", 0.5),
            features.get("score_communication", 0.5),
            features.get("score_leadership", 0.5),
            features.get("score_organisation", 0.5),
            features.get("score_creativite", 0.5),
            features.get("score_analytique", 0.5),
            min(features.get("annees_experience", 0) / 30.0, 1.0),
            min(features.get("nb_objectifs_completes", 0) / 20.0, 1.0),
        ]], dtype=np.float32)

        X_scaled = self.scaler.transform(row)
        X_tensor = torch.tensor(X_scaled, dtype=torch.float32)

        with torch.no_grad():
            logits = self.model(X_tensor)
            probs = torch.softmax(logits, dim=1).squeeze().numpy()

        top_idx = int(np.argmax(probs))
        top_category = self.label_encoder.inverse_transform([top_idx])[0]

        distribution = {
            cat: round(float(probs[i]) * 100, 1)
            for i, cat in enumerate(CATEGORIES)
        }

        return {
            "recommended_category": top_category,
            "confidence": round(float(probs[top_idx]) * 100, 1),
            "distribution": distribution,
        }

    def score_profile(self, strengths: list[str], weaknesses: list[str]) -> dict:
        """
        Transforme les mots-clés SWOT en scores de compétences normalisés (0-1).
        """
        KEYWORD_MAP = {
            "score_technique":      ["python", "code", "développement", "technique", "algorithmique", "typescript", "java", "sql", "data", "ingénierie", "programmation"],
            "score_communication":  ["communication", "rédaction", "présentation", "oral", "écoute", "expression", "négociation", "persuasion"],
            "score_leadership":     ["leadership", "management", "équipe", "vision", "stratégie", "décision", "coaching", "motivation", "direction"],
            "score_organisation":   ["organisation", "planification", "rigueur", "méthode", "gestion", "projet", "priorité", "structuré", "iso"],
            "score_creativite":     ["créativité", "innovation", "créatif", "idée", "conception", "design", "imagination", "originalité"],
            "score_analytique":     ["analyse", "analytique", "données", "statistique", "rapport", "modélisation", "synthèse", "raisonnement"],
        }

        all_text = " ".join(strengths + weaknesses).lower()
        scores = {}
        for skill, keywords in KEYWORD_MAP.items():
            hits = sum(1 for kw in keywords if kw in all_text)
            # Forces boostent le score, faiblesses le réduisent
            strength_hits = sum(1 for kw in keywords if kw in " ".join(strengths).lower())
            weakness_hits = sum(1 for kw in keywords if kw in " ".join(weaknesses).lower())
            base = min(hits / max(len(keywords) * 0.4, 1), 1.0)
            boost = strength_hits * 0.1 - weakness_hits * 0.05
            scores[skill] = max(0.0, min(1.0, base + boost))

        return scores


# Singleton chargé au démarrage du service
model_manager = CVHModelManager()
