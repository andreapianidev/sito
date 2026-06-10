import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2 solid #8B4513',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#8B4513',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#FFF8F0',
    padding: 8,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#8B4513',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#8B4513',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #E5D5C5',
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeft: '3 solid #DC2626',
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#DC2626',
    marginBottom: 4,
  },
  warningContent: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  recommendationBox: {
    backgroundColor: '#FFF8F0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#8B4513',
    marginBottom: 4,
  },
  recommendationContent: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  mealSection: {
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#8B4513',
    marginBottom: 8,
    backgroundColor: '#FFF8F0',
    padding: 6,
    borderRadius: 4,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottom: '0.5 solid #E5E7EB',
  },
  foodName: {
    fontSize: 10,
    color: '#374151',
  },
  alternativesText: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  foodQuantity: {
    fontSize: 10,
    color: '#8B4513',
    fontWeight: 500,
    width: 100,
    textAlign: 'right',
  },
  seasoningSection: {
    backgroundColor: '#FFF8F0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  seasoningTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#8B4513',
    marginBottom: 6,
  },
  seasoningText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 40,
    right: 40,
    borderTop: '1 solid #8B4513',
    paddingTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  footerItem: {
    fontSize: 6.5,
    color: '#666666',
  },
  footerSeparator: {
    marginHorizontal: 6,
    color: '#CCCCCC',
    fontSize: 6,
  },
  pageNumber: {
    fontSize: 7,
    color: '#999999',
    textAlign: 'center',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 15,
  },
  notesText: {
    fontSize: 10,
    color: '#666666',
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #E5E7EB',
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    borderBottom: '1 solid #D1D5DB',
    fontWeight: 700,
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#374151',
  },
  tableCellHeader: {
    padding: 8,
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
  },
  dayCell: {
    width: '15%',
    fontWeight: 700,
  },
  mealCell: {
    width: '42.5%',
  },
});

interface NutritionalPlanPDFProps {
  planData: any;
  guidelines: any[];
  sections: any;
  seasonings: any;
}

const NutritionalPlanPDF: React.FC<NutritionalPlanPDFProps> = ({
  planData,
  guidelines,
  sections,
  seasonings,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const Footer = () => (
    <View style={styles.footer}>
      <View style={styles.footerRow}>
        <Text style={styles.footerItem}>www.vilmanardini.it</Text>
        <Text style={styles.footerSeparator}>•</Text>
        <Text style={styles.footerItem}>info@vilmanardini.it</Text>
        <Text style={styles.footerSeparator}>•</Text>
        <Text style={styles.footerItem}>338.9522275</Text>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.footerItem}>Instagram: nutrizionista vilmanardini</Text>
        <Text style={styles.footerSeparator}>•</Text>
        <Text style={styles.footerItem}>Shop: www.shop.vilmanardini.it</Text>
      </View>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `Pagina ${pageNumber} di ${totalPages}`
      )} fixed />
    </View>
  );

  const getSectionTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      breakfast_sweet: 'Colazione (Dolce)',
      breakfast_salty: 'Colazione (Salata)',
      morning_snack: 'Spuntino Mattina',
      lunch: 'Pranzo',
      afternoon_snack: 'Spuntino Pomeriggio',
      dinner: 'Cena',
      weekly_proteins: 'Lista Secondi Settimanale',
      custom: 'Spuntino',
    };
    return titles[type] || type;
  };

  // Handle both array and object formats for sections
  const sectionsArray = Array.isArray(sections)
    ? sections
    : Object.entries(sections).map(([key, content]: any, index) => ({
        section_type: key,
        title: getSectionTitle(key),
        content: content,
        section_order: index,
      }));

  // Separate weekly_proteins from other meal sections
  const weeklyProteins = sectionsArray.find((section: any) => section.section_type === 'weekly_proteins');

  const sortedSections = sectionsArray
    .filter((section: any) =>
      section.content &&
      Array.isArray(section.content) &&
      section.content.length > 0 &&
      section.section_type !== 'weekly_proteins' // Exclude weekly_proteins from meal sections
    )
    .sort((a: any, b: any) => (a.section_order || 0) - (b.section_order || 0));

  const importantGuidelines = guidelines.filter((g: any) => g.is_important);
  const regularGuidelines = guidelines.filter((g: any) => !g.is_important);

  const resolvedWeeklyFrequencies =
    typeof planData.weekly_frequencies === 'string'
      ? JSON.parse(planData.weekly_frequencies || '{}')
      : planData.weekly_frequencies || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{planData.title}</Text>
          {planData.description && (
            <Text style={styles.subtitle}>{planData.description}</Text>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Data Inizio</Text>
              <Text style={styles.infoValue}>{formatDate(planData.start_date)}</Text>
            </View>
            {planData.end_date && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Data Fine</Text>
                <Text style={styles.infoValue}>{formatDate(planData.end_date)}</Text>
              </View>
            )}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Calorie/giorno</Text>
              <Text style={styles.infoValue}>{planData.daily_calories} kcal</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Proteine</Text>
              <Text style={styles.infoValue}>{planData.daily_protein}g</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Carboidrati</Text>
              <Text style={styles.infoValue}>{planData.daily_carbs}g</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Grassi</Text>
              <Text style={styles.infoValue}>{planData.daily_fats}g</Text>
            </View>
          </View>
        </View>

        {planData.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{planData.notes}</Text>
          </View>
        )}

        {importantGuidelines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Avvertenze Importanti</Text>
            {importantGuidelines.map((guideline: any, idx: number) => (
              <View key={idx} style={styles.warningBox}>
                <Text style={styles.warningTitle}>
                  {guideline.title}
                </Text>
                <Text style={styles.warningContent}>{guideline.content}</Text>
              </View>
            ))}
          </View>
        )}

        <Footer />
      </Page>

      {regularGuidelines.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Raccomandazioni</Text>
          </View>

          <View style={styles.section}>
            {regularGuidelines.map((guideline: any, idx: number) => (
              <View key={idx} style={styles.recommendationBox}>
                <Text style={styles.recommendationTitle}>
                  {guideline.title}
                </Text>
                <Text style={styles.recommendationContent}>{guideline.content}</Text>
              </View>
            ))}
          </View>

          <Footer />
        </Page>
      )}

      {sortedSections.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Piano Alimentare Giornaliero</Text>
          </View>

          {sortedSections.map((section: any, index: number) => {
            const sectionTitleLower = (section.title || getSectionTitle(section.section_type)).toLowerCase();
            const isLunchOrDinner = sectionTitleLower.includes('pranzo') || sectionTitleLower.includes('cena');
            return (
              <View key={`${section.section_type || 'section'}-${index}`} style={styles.mealSection}>
                <Text style={styles.mealTitle}>
                  {section.title || getSectionTitle(section.section_type)}
                </Text>
                {section.content && Array.isArray(section.content) && section.content.map((item: any, idx: number) => {
                  const isVerdura = typeof item.food === 'string' && item.food.toLowerCase().includes('verdura');
                  return (
                    <React.Fragment key={idx}>
                      {isLunchOrDinner && isVerdura && (
                        <View style={{ backgroundColor: '#FFF8E1', padding: 6, marginBottom: 4, borderLeft: '3 solid #F59E0B', paddingLeft: 8 }}>
                          <Text style={{ fontSize: 9, color: '#92400E', fontWeight: 700 }}>
                            Secondo piatto {'→'} vedi tabella secondi piatti settimanali
                          </Text>
                        </View>
                      )}
                      <View style={styles.foodItem}>
                        <View style={{ flex: 3 }}>
                          <Text style={styles.foodName}>{item.food}</Text>
                          {item.alternatives && item.alternatives.length > 0 && (
                            <Text style={styles.alternativesText}>
                              Alternative: {item.alternatives.join(', ')}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.foodQuantity}>
                          {item.quantity} {item.unit || ''}
                        </Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            );
          })}

          <Footer />
        </Page>
      )}

      {resolvedWeeklyFrequencies?.meals && Object.keys(resolvedWeeklyFrequencies.meals).length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Tabella Secondi Piatti Settimanali</Text>
            <Text style={styles.subtitle}>
              Distribuzione delle proteine per ogni pasto della settimana
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.dayCell]}>Giorno</Text>
              <Text style={[styles.tableCellHeader, styles.mealCell]}>Pranzo</Text>
              <Text style={[styles.tableCellHeader, styles.mealCell]}>Cena</Text>
            </View>
            {['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'].map((day, index) => {
              const dayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
              const dayData = resolvedWeeklyFrequencies.meals[day];
              if (!dayData) return null;

              return (
                <View key={day} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.dayCell]}>{dayLabels[index]}</Text>
                  <Text style={[styles.tableCell, styles.mealCell]}>{dayData.pranzo || '-'}</Text>
                  <Text style={[styles.tableCell, styles.mealCell]}>{dayData.cena || '-'}</Text>
                </View>
              );
            })}
          </View>

          <Footer />
        </Page>
      )}

      {weeklyProteins && weeklyProteins.content && Array.isArray(weeklyProteins.content) && weeklyProteins.content.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Lista Secondi Settimanale</Text>
          </View>

          <View style={styles.section}>
            {weeklyProteins.content.map((day: any, index: number) => (
              <View key={index} style={{ marginBottom: 15, borderLeft: '3 solid #8B4513', paddingLeft: 12 }}>
                <Text style={[styles.seasoningTitle, { marginBottom: 8 }]}>{day.day}</Text>
                <View style={{ marginBottom: 6 }}>
                  <Text style={[styles.seasoningText, { fontWeight: 700, marginBottom: 3 }]}>Pranzo:</Text>
                  <Text style={styles.seasoningText}>{day.first_option}</Text>
                </View>
                <View>
                  <Text style={[styles.seasoningText, { fontWeight: 700, marginBottom: 3 }]}>Cena:</Text>
                  <Text style={styles.seasoningText}>{day.second_option}</Text>
                </View>
              </View>
            ))}
          </View>

          <Footer />
        </Page>
      )}

      {planData.preparation_instructions && Object.keys(planData.preparation_instructions).length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Confezionamento e Preparazione degli Alimenti</Text>
          </View>

          <View style={styles.section}>
            {planData.preparation_instructions.primo_piatto && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>PRIMO PIATTO (pasta, riso, cereali)</Text>
                {planData.preparation_instructions.primo_piatto.non_condito && (
                  <Text style={styles.seasoningText}>• {planData.preparation_instructions.primo_piatto.non_condito}</Text>
                )}
                {planData.preparation_instructions.primo_piatto.condito && (
                  <Text style={styles.seasoningText}>• {planData.preparation_instructions.primo_piatto.condito}</Text>
                )}
                {planData.preparation_instructions.primo_piatto.condito_salsa && (
                  <Text style={styles.seasoningText}>• {planData.preparation_instructions.primo_piatto.condito_salsa}</Text>
                )}
                {planData.preparation_instructions.primo_piatto.minestra && (
                  <Text style={styles.seasoningText}>• {planData.preparation_instructions.primo_piatto.minestra}</Text>
                )}
              </View>
            )}

            {planData.preparation_instructions.brodi && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>BRODI E MINESTRE</Text>
                {planData.preparation_instructions.brodi.vegetale && (
                  <Text style={styles.seasoningText}>• Brodo vegetale: {planData.preparation_instructions.brodi.vegetale}</Text>
                )}
                {planData.preparation_instructions.brodi.verdura_passato && (
                  <Text style={styles.seasoningText}>• Passato di verdura: {planData.preparation_instructions.brodi.verdura_passato}</Text>
                )}
                {planData.preparation_instructions.brodi.verdura_pezzi && (
                  <Text style={styles.seasoningText}>• Minestrone: {planData.preparation_instructions.brodi.verdura_pezzi}</Text>
                )}
                {planData.preparation_instructions.brodi.carne && (
                  <Text style={styles.seasoningText}>• Brodo di carne: {planData.preparation_instructions.brodi.carne}</Text>
                )}
              </View>
            )}

            {planData.preparation_instructions.carne_pesce && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>CARNE, PESCE, UOVA E LEGUMI</Text>
                <Text style={styles.seasoningText}>{planData.preparation_instructions.carne_pesce}</Text>
              </View>
            )}

            {planData.preparation_instructions.verdure && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>VERDURE</Text>
                <Text style={styles.seasoningText}>{planData.preparation_instructions.verdure}</Text>
              </View>
            )}

            {planData.preparation_instructions.patate && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>PATATE</Text>
                <Text style={styles.seasoningText}>{planData.preparation_instructions.patate}</Text>
              </View>
            )}

            {planData.preparation_instructions.frutta && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>FRUTTA</Text>
                <Text style={styles.seasoningText}>{planData.preparation_instructions.frutta}</Text>
              </View>
            )}

            {planData.preparation_instructions.olio && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.seasoningTitle}>OLIO</Text>
                <Text style={[styles.seasoningText, { fontWeight: 700 }]}>{planData.preparation_instructions.olio}</Text>
              </View>
            )}
          </View>

          <Footer />
        </Page>
      )}

      {seasonings && Object.keys(seasonings).length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Condimenti degli Alimenti</Text>
          </View>

          <View style={styles.section}>
            {Object.entries(seasonings).map(([key, value]: any) => (
              <View key={key} style={styles.seasoningSection}>
                <Text style={styles.seasoningTitle}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.seasoningText}>{value}</Text>
              </View>
            ))}
          </View>

          <Footer />
        </Page>
      )}
    </Document>
  );
};

export default NutritionalPlanPDF;
