import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InvoiceItem, Company } from '@/data/mockData';

interface SimpleInvoicePdfProps {
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    company: Company;
    options: {
        paymentTerms: string;
        dueDate: string;
        notes: string;
        transportMode: string;
        vehicleNo: string;
    };
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '2px solid #000',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5,
    },
    invoiceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5,
    },
    text: {
        fontSize: 10,
        marginBottom: 3,
    },
    table: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #000',
        padding: 8,
        fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #ddd',
        padding: 8,
    },
    col1: { width: '5%' },
    col2: { width: '40%' },
    col3: { width: '10%' },
    col4: { width: '15%', textAlign: 'right' },
    col5: { width: '15%', textAlign: 'right' },
    col6: { width: '15%', textAlign: 'right' },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 10,
        borderTop: '2px solid #000',
    },
    totalLabel: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginRight: 20,
    },
    totalValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
    },
    footer: {
        marginTop: 30,
        borderTop: '1px solid #000',
        paddingTop: 10,
        fontSize: 9,
        color: '#666',
    },
});

const SimpleInvoicePdf: React.FC<SimpleInvoicePdfProps> = ({
    invoiceNumber,
    invoiceDate,
    items,
    company,
    options,
}) => {
    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const amount = item.item.rate * item.quantity;
            const discountAmount = (amount * item.discount) / 100;
            return sum + (amount - discountAmount);
        }, 0);
    };

    const total = calculateTotal();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>TAX INVOICE</Text>
                    <View style={styles.invoiceInfo}>
                        <View>
                            <Text style={styles.text}>Invoice #: {invoiceNumber}</Text>
                            <Text style={styles.text}>Date & Time: {invoiceDate}</Text>
                        </View>
                        <View>
                            {options.dueDate && (
                                <Text style={styles.text}>Due Date: {options.dueDate}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Customer Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill To:</Text>
                    <Text style={styles.text}>{company.name}</Text>
                    <Text style={styles.text}>{company.address}</Text>
                    <Text style={styles.text}>
                        {company.state} ({company.stateCode})
                    </Text>
                    <Text style={styles.text}>GST: {company.gstNo}</Text>
                    {company.phone && <Text style={styles.text}>Phone: {company.phone}</Text>}
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>#</Text>
                        <Text style={styles.col2}>Item</Text>
                        <Text style={styles.col3}>HSN</Text>
                        <Text style={styles.col4}>Qty</Text>
                        <Text style={styles.col5}>Rate</Text>
                        <Text style={styles.col6}>Amount</Text>
                    </View>

                    {items.map((row, index) => {
                        const amount = row.item.rate * row.quantity;
                        const discountAmount = (amount * row.discount) / 100;
                        const finalAmount = amount - discountAmount;

                        return (
                            <View key={row.id} style={styles.tableRow}>
                                <Text style={styles.col1}>{index + 1}</Text>
                                <View style={styles.col2}>
                                    <Text>{row.item.name}</Text>
                                    {row.item.category && (
                                        <Text style={{ fontSize: 8, color: '#666' }}>
                                            ({row.item.category})
                                        </Text>
                                    )}
                                    {row.discount > 0 && (
                                        <Text style={{ fontSize: 8, color: '#666' }}>
                                            Discount: {row.discount}%
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.col3}>{row.item.hsn}</Text>
                                <Text style={styles.col4}>
                                    {row.quantity} {row.item.unit}
                                </Text>
                                <Text style={styles.col5}>₹{row.item.rate.toFixed(2)}</Text>
                                <Text style={styles.col6}>₹{finalAmount.toFixed(2)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Total */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
                </View>

                {/* Notes */}
                {options.notes && (
                    <View style={[styles.section, { marginTop: 20 }]}>
                        <Text style={styles.sectionTitle}>Notes:</Text>
                        <Text style={styles.text}>{options.notes}</Text>
                    </View>
                )}

                {/* Transport Details */}
                {(options.transportMode || options.vehicleNo) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Transport Details:</Text>
                        {options.transportMode && (
                            <Text style={styles.text}>Mode: {options.transportMode}</Text>
                        )}
                        {options.vehicleNo && (
                            <Text style={styles.text}>Vehicle No: {options.vehicleNo}</Text>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>This is a computer-generated invoice.</Text>
                    <Text>Payment Terms: {options.paymentTerms}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default SimpleInvoicePdf;
