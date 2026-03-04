import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InvoiceItem, Company } from '@/data/mockData';

interface CustomInvoicePdfProps {
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
        padding: 15,
        fontSize: 8,
        fontFamily: 'Helvetica',
    },
    container: {
        border: '2px solid #000',
    },
    // Header
    header: {
        textAlign: 'center',
        borderBottom: '1px solid #000',
        padding: 6,
    },
    headerTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
    },
    headerSubtext: {
        fontSize: 7,
    },
    // Top section with seller and invoice details
    topSection: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
    },
    sellerSection: {
        width: '50%',
        padding: 8,
        borderRight: '1px solid #000',
    },
    logoPlaceholder: {
        width: 50,
        height: 50,
        border: '1px dashed #666',
        marginBottom: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    companyName: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 3,
    },
    companyDetail: {
        fontSize: 7,
        marginBottom: 1,
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    invoiceDetailsSection: {
        width: '50%',
    },
    detailRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
    },
    detailCell: {
        width: '25%',
        padding: 3,
        fontSize: 7,
        borderRight: '1px solid #000',
    },
    detailCellLast: {
        width: '25%',
        padding: 3,
        fontSize: 7,
    },
    detailLabel: {
        fontFamily: 'Helvetica-Bold',
    },
    // Buyer section
    buyerSection: {
        padding: 8,
        borderBottom: '1px solid #000',
    },
    sectionTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
        marginBottom: 3,
    },
    buyerGrid: {
        flexDirection: 'row',
        marginTop: 3,
    },
    buyerGridCol: {
        width: '33.33%',
        fontSize: 7,
    },
    // Items table
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        backgroundColor: '#f5f5f5',
        padding: 4,
    },
    tableHeaderCell: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        borderRight: '1px solid #000',
    },
    tableHeaderCellLast: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        minHeight: 25,
    },
    tableCell: {
        padding: 4,
        fontSize: 7,
        borderRight: '1px solid #000',
    },
    tableCellLast: {
        padding: 4,
        fontSize: 7,
    },
    slNo: { width: '4%', textAlign: 'center' },
    description: { width: '36%' },
    hsn: { width: '10%', textAlign: 'center' },
    quantity: { width: '14%', textAlign: 'right' },
    rate: { width: '10%', textAlign: 'right' },
    per: { width: '8%', textAlign: 'center' },
    amount: { width: '18%', textAlign: 'right' },
    // Totals
    totalRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
    },
    totalLabel: {
        width: '82%',
        padding: 4,
        fontSize: 8,
        textAlign: 'right',
        borderRight: '1px solid #000',
        fontFamily: 'Helvetica-Bold',
    },
    totalValue: {
        width: '18%',
        padding: 4,
        fontSize: 8,
        textAlign: 'right',
    },
    grandTotal: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
    },
    // Bottom sections
    bottomSection: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
    },
    amountWordsSection: {
        width: '60%',
        padding: 8,
        borderRight: '1px solid #000',
    },
    qrSection: {
        width: '40%',
        padding: 8,
    },
    qrPlaceholder: {
        width: 80,
        height: 80,
        border: '1px dashed #666',
        marginBottom: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    amountWords: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5,
    },
    // HSN Summary table
    hsnTable: {
        marginTop: 5,
    },
    hsnRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #ddd',
        padding: 2,
    },
    hsnCell: {
        width: '20%',
        fontSize: 6,
        textAlign: 'center',
    },
    // Tax amount in words
    taxWordsSection: {
        padding: 8,
        borderBottom: '1px solid #000',
        fontSize: 7,
    },
    // Footer
    footerSection: {
        flexDirection: 'row',
    },
    declarationSection: {
        width: '60%',
        padding: 8,
        borderRight: '1px solid #000',
    },
    bankSection: {
        width: '40%',
        padding: 8,
    },
    declarationText: {
        fontSize: 7,
        marginBottom: 3,
    },
    bankDetail: {
        fontSize: 7,
        marginBottom: 2,
    },
    signature: {
        marginTop: 30,
        alignItems: 'flex-end',
    },
    signatureText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    signatureLine: {
        fontSize: 7,
        marginTop: 15,
    },
});

const CustomInvoicePdf: React.FC<CustomInvoicePdfProps> = ({
    invoiceNumber,
    invoiceDate,
    items,
    company,
    options,
}) => {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
        const amount = item.item.rate * item.quantity;
        const discount = (amount * item.discount) / 100;
        return sum + (amount - discount);
    }, 0);


    const igstRate = 0; // Set to 0 as per user request (no GST)
    const igstAmount = (subtotal * igstRate) / 100;
    const roundOff = Math.round(subtotal + igstAmount) - (subtotal + igstAmount);
    const grandTotal = subtotal + igstAmount + roundOff;
    const previousBalance = company.pendingAmount || 0;
    const totalPayable = grandTotal + previousBalance;

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Number to words conversion (simplified)
    const numberToWords = (num: number): string => {
        // Placeholder - returns formatted number
        return `INR ${num.toFixed(2)} Only`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Order Estimates</Text>
                    </View>

                    {/* Top Section - Seller & Invoice Details */}
                    <View style={styles.topSection}>
                        {/* Seller Details */}
                        <View style={styles.sellerSection}>
                            <View style={styles.logoPlaceholder}>
                                <Text style={{ fontSize: 6 }}>LOGO</Text>
                            </View>
                            <Text style={styles.companyName}>{company.name}</Text>
                            <Text style={styles.companyDetail}>{company.address}</Text>
                            <Text style={styles.companyDetail}>
                                {company.state}, {company.stateCode}
                            </Text>
                            <Text style={styles.companyDetail}>
                                <Text style={styles.bold}>GSTIN/UIN: </Text>{company.gstNo}
                            </Text>
                            {company.phone && (
                                <Text style={styles.companyDetail}>
                                    <Text style={styles.bold}>Contact: </Text>{company.phone}
                                </Text>
                            )}
                        </View>

                        {/* Invoice Details Table */}
                        <View style={styles.invoiceDetailsSection}>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailCell, styles.detailLabel]}>e-Way Bill No.</Text>
                                <Text style={[styles.detailCell]}></Text>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Date & Time</Text>
                                <Text style={[styles.detailCellLast]}>{invoiceDate}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Delivery Note</Text>
                                <Text style={[styles.detailCell]}>{invoiceNumber}</Text>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Mode/Terms of Payment</Text>
                                <Text style={[styles.detailCellLast]}>{options.paymentTerms}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Reference No. & Date</Text>
                                <Text style={[styles.detailCell]}></Text>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Other References</Text>
                                <Text style={[styles.detailCellLast]}></Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Buyer's Order No.</Text>
                                <Text style={[styles.detailCell]}>Dated</Text>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Dispatch Doc No.</Text>
                                <Text style={[styles.detailCellLast]}>Delivery Note Date</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Dispatched through</Text>
                                <Text style={[styles.detailCell]}>{options.transportMode}</Text>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Destination</Text>
                                <Text style={[styles.detailCellLast]}></Text>
                            </View>
                            <View style={[styles.detailRow, { borderBottom: 'none' }]}>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Bill of Lading/LR-RR No.</Text>
                                <Text style={[styles.detailCell]}>dt.</Text>
                                <Text style={[styles.detailCell, styles.detailLabel]}>Motor Vehicle No.</Text>
                                <Text style={[styles.detailCellLast]}>{options.vehicleNo}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Buyer Section */}
                    <View style={styles.buyerSection}>
                        <Text style={styles.sectionTitle}>Buyer (Bill to)</Text>
                        <Text style={[styles.companyDetail, { fontSize: 8, fontFamily: 'Helvetica-Bold' }]}>
                            {company.name}
                        </Text>
                        <Text style={styles.companyDetail}>{company.address}</Text>
                        <View style={styles.buyerGrid}>
                            <Text style={styles.buyerGridCol}>
                                <Text style={styles.bold}>GSTIN/UIN: </Text>{company.gstNo}
                            </Text>
                            <Text style={styles.buyerGridCol}>
                                <Text style={styles.bold}>State Name: </Text>{company.state}
                            </Text>
                            <Text style={styles.buyerGridCol}>
                                <Text style={styles.bold}>Place of Supply: </Text>{company.stateCode}
                            </Text>
                        </View>
                    </View>

                    {/* Items Table */}
                    <View style={styles.table}>
                        {/* Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.slNo]}>Sl{'\n'}No.</Text>
                            <Text style={[styles.tableHeaderCell, styles.description]}>Description of Goods</Text>
                            <Text style={[styles.tableHeaderCell, styles.hsn]}>HSN/SAC</Text>
                            <Text style={[styles.tableHeaderCell, styles.quantity]}>Quantity</Text>
                            <Text style={[styles.tableHeaderCell, styles.rate]}>Rate</Text>
                            <Text style={[styles.tableHeaderCell, styles.per]}>per</Text>
                            <Text style={[styles.tableHeaderCellLast, styles.amount]}>Amount</Text>
                        </View>

                        {/* Rows */}
                        {items.map((row, idx) => {
                            const amount = row.item.rate * row.quantity;
                            const discount = (amount * row.discount) / 100;
                            const final = amount - discount;

                            return (
                                <View key={row.id} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.slNo]}>{idx + 1}</Text>
                                    <View style={[styles.tableCell, styles.description]}>
                                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{row.item.name}</Text>
                                        {row.item.category && (
                                            <Text style={{ fontSize: 6, marginTop: 2 }}>{row.item.category}</Text>
                                        )}
                                    </View>
                                    <Text style={[styles.tableCell, styles.hsn]}>{row.item.hsn}</Text>
                                    <Text style={[styles.tableCell, styles.quantity]}>
                                        {row.quantity.toFixed(3)} {row.item.unit}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.rate]}>{row.item.rate.toFixed(2)}</Text>
                                    <Text style={[styles.tableCell, styles.per]}>{row.item.unit}</Text>
                                    <Text style={[styles.tableCellLast, styles.amount]}>
                                        {final.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Subtotal */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}></Text>
                            <Text style={styles.totalValue}>
                                {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>

                        {/* Invoice Amount */}
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, styles.grandTotal]}>Invoice Amount</Text>
                            <Text style={[styles.totalValue, styles.grandTotal]}>
                                ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>

                        {/* Previous Balance (if any) */}
                        {previousBalance > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Previous Balance</Text>
                                <Text style={styles.totalValue}>
                                    ₹ {previousBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        )}

                        {/* Total Payable */}
                        <View style={[styles.totalRow, { borderBottom: '2px solid #000' }]}>
                            <Text style={[styles.totalLabel, styles.grandTotal]}>Total Payable</Text>
                            <Text style={[styles.totalValue, styles.grandTotal]}>
                                ₹ {totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>

                    {/* Amount in words + QR */}
                    <View style={styles.bottomSection}>
                        <View style={styles.amountWordsSection}>
                            <Text style={styles.sectionTitle}>Amount Chargeable (in words)</Text>
                            <Text style={styles.amountWords}>{numberToWords(totalPayable)}</Text>
                            <Text style={{ fontSize: 6, fontStyle: 'italic' }}>E. & O.E</Text>

                            {/* HSN Summary Table */}
                            <View style={styles.hsnTable}>
                                <Text style={[styles.sectionTitle, { marginTop: 5 }]}>HSN/SAC</Text>
                                <View style={styles.hsnRow}>
                                    <Text style={[styles.hsnCell, { fontFamily: 'Helvetica-Bold' }]}>HSN/SAC</Text>
                                    <Text style={[styles.hsnCell, { fontFamily: 'Helvetica-Bold' }]}>Taxable Value</Text>
                                    <Text style={[styles.hsnCell, { fontFamily: 'Helvetica-Bold' }]}>Rate</Text>
                                    <Text style={[styles.hsnCell, { fontFamily: 'Helvetica-Bold' }]}>Amount</Text>
                                    <Text style={[styles.hsnCell, { fontFamily: 'Helvetica-Bold' }]}>Total</Text>
                                </View>
                                {items.length > 0 && (
                                    <View style={styles.hsnRow}>
                                        <Text style={styles.hsnCell}>{items[0].item.hsn}</Text>
                                        <Text style={styles.hsnCell}>{subtotal.toFixed(2)}</Text>
                                        <Text style={styles.hsnCell}>{igstRate}%</Text>
                                        <Text style={styles.hsnCell}>{igstAmount.toFixed(2)}</Text>
                                        <Text style={styles.hsnCell}>{igstAmount.toFixed(2)}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.qrSection}>
                            <View style={styles.qrPlaceholder}>
                                <Text style={{ fontSize: 6 }}>QR CODE</Text>
                            </View>
                            <Text style={{ fontSize: 6, textAlign: 'center', marginBottom: 3 }}>Scan to pay</Text>
                            <Text style={styles.bankDetail}>
                                <Text style={styles.bold}>Total Payable: </Text>
                                {totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>

                    {/* Tax Amount in Words */}
                    <View style={styles.taxWordsSection}>
                        <Text>
                            <Text style={styles.bold}>Tax Amount (in words): </Text>
                            {numberToWords(igstAmount)}
                        </Text>
                    </View>

                    {/* Footer - Declaration + Bank Details */}
                    <View style={styles.footerSection}>
                        <View style={styles.declarationSection}>
                            <Text style={[styles.sectionTitle, { marginBottom: 5 }]}>Declaration</Text>
                            <Text style={styles.declarationText}>
                                We declare that this invoice shows the actual price of the goods described and
                                that all particulars are true and correct.
                            </Text>
                        </View>

                        <View style={styles.bankSection}>
                            <Text style={[styles.sectionTitle, { marginBottom: 5 }]}>Company's Bank Details</Text>
                            <Text style={styles.bankDetail}>
                                <Text style={styles.bold}>A/c Holder's Name: </Text>{company.name}
                            </Text>
                            <Text style={styles.bankDetail}>
                                <Text style={styles.bold}>Bank Name: </Text>
                            </Text>
                            <Text style={styles.bankDetail}>
                                <Text style={styles.bold}>A/c No.: </Text>
                            </Text>
                            <Text style={styles.bankDetail}>
                                <Text style={styles.bold}>Branch & IFS Code: </Text>
                            </Text>

                            <View style={styles.signature}>
                                <Text style={styles.signatureText}>for {company.name}</Text>
                                <Text style={styles.signatureLine}>Authorised Signatory</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default CustomInvoicePdf;
