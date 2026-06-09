import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import React from 'react'
import type { ExportPayload } from '@/types'

// Styles PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 24, borderBottom: '2px solid #2563eb', paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#6b7280' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1px solid #dbeafe',
  },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#374151', width: 120 },
  value: { fontSize: 10, color: '#4b5563', flex: 1 },
  badge: {
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  badgeText: { fontSize: 9, color: '#1d4ed8' },
  bullet: { fontSize: 10, color: '#4b5563', marginBottom: 4, paddingLeft: 12 },
  scoreBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  scoreValue: { fontSize: 36, fontWeight: 'bold', color: '#2563eb' },
  scoreLabel: { fontSize: 10, color: '#6b7280' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#9ca3af' },
})

function CVHReport({ payload }: { payload: ExportPayload }) {
  const { user, analyses, objectives, generatedAt } = payload
  const latestAnalysis = analyses[0]

  return React.createElement(
    Document,
    { title: 'Bilan CVH', author: 'Catalyseur de Valeur Humaine' },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // En-tête
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'Bilan de Valeur Humaine'),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${user.name ?? user.email} — Généré le ${new Date(generatedAt).toLocaleDateString('fr-FR')}`
        )
      ),

      // Profil
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Profil'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Poste :'),
          React.createElement(Text, { style: styles.value }, user.position ?? 'Non renseigné')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Département :'),
          React.createElement(Text, { style: styles.value }, user.department ?? 'Non renseigné')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Email :'),
          React.createElement(Text, { style: styles.value }, user.email)
        )
      ),

      // Score d'adéquation
      latestAnalysis?.matchScore !== null && latestAnalysis?.matchScore !== undefined
        ? React.createElement(
            View,
            { style: styles.scoreBox },
            React.createElement(Text, { style: styles.scoreValue }, `${latestAnalysis.matchScore}%`),
            React.createElement(Text, { style: styles.scoreLabel }, "Score d'adéquation au poste")
          )
        : null,

      // Analyse SWOT
      latestAnalysis
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'Analyse SWOT'),
            React.createElement(Text, { style: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 } }, 'Forces'),
            ...latestAnalysis.strengths.map((s, i) =>
              React.createElement(Text, { key: i, style: styles.bullet }, `• ${s}`)
            ),
            React.createElement(Text, { style: { fontSize: 11, fontWeight: 'bold', marginVertical: 4 } }, 'Axes d\'amélioration'),
            ...latestAnalysis.weaknesses.map((w, i) =>
              React.createElement(Text, { key: i, style: styles.bullet }, `• ${w}`)
            )
          )
        : null,

      // Objectifs
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Objectifs de développement'),
        ...objectives.slice(0, 8).map((obj, i) =>
          React.createElement(
            View,
            { key: i, style: { marginBottom: 8 } },
            React.createElement(
              View,
              { style: styles.row },
              React.createElement(Text, { style: styles.label }, obj.title),
              React.createElement(Text, { style: styles.value }, `${obj.progress}% — ${obj.status}`)
            )
          )
        )
      ),

      // Pied de page
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, 'CVH — Catalyseur de Valeur Humaine'),
        React.createElement(Text, { style: styles.footerText }, `Document confidentiel — RGPD`)
      )
    )
  )
}

export async function generatePDFBuffer(payload: ExportPayload): Promise<Buffer> {
  const doc = React.createElement(CVHReport, { payload })
  const instance = pdf(doc as Parameters<typeof pdf>[0])
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
