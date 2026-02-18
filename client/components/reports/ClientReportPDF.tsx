
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a nice font if possible, otherwise use standard
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT_v3.ttf' }, // Fallback to standard
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#0055D4', // Brand Blue
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000'
    },
    brandSubtitle: {
        fontSize: 10,
        color: '#666666',
        marginTop: 4
    },
    section: {
        margin: 10,
        padding: 10,
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        color: '#333333',
        fontWeight: 'bold'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 150,
        fontSize: 12,
        color: '#666666',
        fontWeight: 'bold'
    },
    value: {
        fontSize: 12,
        color: '#000000'
    },
    warningBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FFF4F4',
        borderLeftWidth: 4,
        borderLeftColor: '#D32F2F',
        borderRadius: 4
    },
    safeBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#F0FDF4',
        borderLeftWidth: 4,
        borderLeftColor: '#22C55E',
        borderRadius: 4
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 5
    },
    safeTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#15803D',
        marginBottom: 5
    },
    text: {
        fontSize: 11,
        lineHeight: 1.5,
        marginBottom: 5
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#999999',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10
    }
});

interface PsychrometricData {
    dryBulb: number;
    wetBulb: number;
    rh: number;
    dewPoint: number;
    enthalpy: number;
}

interface ClientReportPDFProps {
    data: PsychrometricData;
    clientName?: string;
    techName?: string;
}

export const ClientReportPDF: React.FC<ClientReportPDFProps> = ({ data, clientName = "Valued Client", techName = "ThermoNeural Tech" }) => {
    const isHighHumidity = data.rh > 55;
    const isLowHumidity = data.rh < 30;
    const isComfortable = !isHighHumidity && !isLowHumidity;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandTitle}>ThermoNeural</Text>
                        <Text style={styles.brandSubtitle}>Home Health & Efficiency Report</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 10, color: '#666' }}>{new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View style={styles.section}>
                    <Text style={styles.text}>Prepared for: {clientName}</Text>
                    <Text style={styles.text}>Technician: {techName}</Text>
                </View>

                {/* Readings Section */}
                <View style={styles.section}>
                    <Text style={styles.title}>Current Air Quality Readings</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Temperature:</Text>
                        <Text style={styles.value}>{data.dryBulb}°F</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Relative Humidity:</Text>
                        <Text style={[styles.value, { color: isComfortable ? 'green' : 'red', fontWeight: 'bold' }]}>
                            {data.rh.toFixed(1)}%
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Dew Point:</Text>
                        <Text style={styles.value}>{data.dewPoint.toFixed(1)}°F</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Wet Bulb:</Text>
                        <Text style={styles.value}>{data.wetBulb}°F</Text>
                    </View>
                </View>

                {/* Diagnosis / Educational Section */}
                <View style={styles.section}>
                    <Text style={styles.title}>Home Health Analysis</Text>

                    {isHighHumidity && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>⚠️ High Humidity Alert</Text>
                            <Text style={styles.text}>
                                Your home's humidity is currently above the recommended 55% threshold.
                                High humidity creates an environment waiting for mold growth, dust mites, and bacteria.
                            </Text>
                            <Text style={[styles.text, { marginTop: 10, fontWeight: 'bold' }]}>
                                Recommended Action: Whole-Home Dehumidification
                            </Text>
                            <Text style={styles.text}>
                                Installing a dehumidifier can lower moisture levels, protect your furniture,
                                and improve air quality instantly.
                            </Text>
                        </View>
                    )}

                    {isLowHumidity && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningTitle}>⚠️ Low Humidity Alert</Text>
                            <Text style={styles.text}>
                                Your home's humidity is significantly low (below 30%).
                                Dry air can increase the spread of airborne viruses, cause dry skin/eyes, and damage wood flooring.
                            </Text>
                            <Text style={[styles.text, { marginTop: 10, fontWeight: 'bold' }]}>
                                Recommended Action: Whole-Home Humidifier
                            </Text>
                        </View>
                    )}

                    {isComfortable && (
                        <View style={styles.safeBox}>
                            <Text style={styles.safeTitle}>✅ Optimal Air Quality</Text>
                            <Text style={styles.text}>
                                Great news! Your home is within the optimal humidity range (30% - 55%).
                                This balance is ideal for both comfort and health.
                            </Text>
                            <Text style={styles.text}>
                                Keep up with regular maintenance to ensure these conditions persist.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Visual Gauge Placeholder (Text for now for simplicity in PDF) */}
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>
                        *ASHRAE Standards recommend keeping humidity between 30% and 60% for optimal human health.
                    </Text>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    ThermoNeural HVAC Solutions • Generated by AI Diagnostic Engine • www.thermoneural.com
                </Text>
            </Page>
        </Document>
    );
};
