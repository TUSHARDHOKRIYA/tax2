import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define interfaces for type safety
interface InvoiceItem {
  slNo: number;
  description: string;
  hsn?: string;
  quantity: string;
  rate: number;
  unit: string;
  amount: number;
  boxes?: number;
  itemsPerBox?: number;
}

interface CompanyDetails {
  name: string;
  address: string[];
  state: string;
  stateCode: string;
  contact: string[];
  email: string;
  website: string;
  logo?: string;
  gstin?: string;
}

interface BuyerDetails {
  name: string;
  address: string[];
  pan: string;
  state: string;
  stateCode: string;
  placeOfSupply: string;
  contact?: string;
  email?: string;
  gstin?: string;
}

interface InvoiceDetails {
  invoiceNo: string;
  invoiceDate: string;
  eWayBillNo?: string;
  deliveryNote?: string;
  referenceNo?: string;
  buyerOrderNo?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  billOfLadingNo?: string;
  billOfLadingDate?: string;
  modeOfPayment: string;
  otherReferences?: string;
  deliveryNoteDate?: string;
  destination?: string;
  motorVehicleNo?: string;
  termsOfDelivery?: string;
}

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNo: string;
  branchAndIFSC: string;
  swiftCode?: string;
}

interface InvoicePdfProps {
  company: CompanyDetails;
  buyer: BuyerDetails;
  invoiceDetails: InvoiceDetails;
  items: InvoiceItem[];
  previousBalance?: number;
  bankDetails: BankDetails;
  qrCode?: string;
  notes?: string;
}

// Convert mm to pt (1mm ≈ 2.83465 pt at 72 DPI)
const mm = (v: number) => v * 2.83465;

// Create styles per specification
const styles = StyleSheet.create({
  // Page: A4, 12mm margins - margins create visual gap; container fills printable area
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: mm(8),
  },

  // Outer border: 1px solid black, no flex to avoid layout issues
  container: {
    border: '1px solid #000000',
  },

  // BLOCK 1 - Title Bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: mm(10),
    paddingHorizontal: mm(3),
    borderBottom: '1px solid #000000',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.2,
  },
  headerSubtext: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    fontStyle: 'italic',
  },

  // BLOCK 2 - Company & Invoice Details: 60% left, 40% right
  topSection: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
  },

  // LEFT SECTION (60%) - Company + Buyer
  leftSection: {
    width: '60%',
    padding: mm(3),
    borderRight: '1px solid #000000',
  },
  companyBlock: {
    flexDirection: 'row',
    marginBottom: mm(2),
  },
  logoBox: {
    width: mm(18),
    height: mm(18),
    marginRight: mm(3),
  },
  companyDetailsBlock: {
    flex: 1,
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: mm(1),
    lineHeight: 1.2,
  },
  companyDetail: {
    fontSize: 9,
    marginBottom: mm(1),
    lineHeight: 1.2,
  },
  boldLabel: {
    fontFamily: 'Helvetica-Bold',
  },
  buyerBlock: {
    borderTop: '1px solid #000000',
    paddingTop: mm(1),
    marginTop: mm(1),
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: mm(1),
    lineHeight: 1.2,
  },
  buyerName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: mm(1),
    lineHeight: 1.2,
  },
  buyerDetail: {
    fontSize: 8,
    marginBottom: mm(0.5),
    lineHeight: 1.2,
  },

  // RIGHT SECTION (40%) - Invoice Meta Grid
  rightSection: {
    width: '40%',
  },
  detailRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
    minHeight: mm(6.5),
  },
  detailHalf: {
    width: '50%',
    padding: mm(2),
    borderRight: '1px solid #000000',
    justifyContent: 'center',
  },
  detailHalfLast: {
    width: '50%',
    padding: mm(2),
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  detailValue: {
    fontSize: 9,
  },

  // Items Table
  itemsTable: {
    width: '100%',
    marginTop: mm(1),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderBottom: '1px solid #000000',
  },
  tableHeaderCell: {
    padding: mm(1.5),
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    borderRight: '1px solid #000000',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  tableHeaderCellDesc: {
    textAlign: 'left',
  },
  tableHeaderCellLast: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    borderRight: 'none',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
    lineHeight: 1.1,
  },
  tableCell: {
    padding: mm(1.5),
    fontSize: 9,
    borderRight: '1px solid #000000',
    lineHeight: 1.1,
  },
  tableCellLast: {
    padding: mm(1.5),
    fontSize: 9,
    lineHeight: 1.1,
  },
  // Column widths
  slNoCell: { width: '6%', textAlign: 'center' },
  descriptionCell: { width: '33%', textAlign: 'left' },
  totalItemsCell: { width: '10%', textAlign: 'center' },
  boxesCell: { width: '10%', textAlign: 'center' },
  itemsPerBoxCell: { width: '10%', textAlign: 'center' },
  rateCell: { width: '12%', textAlign: 'right' },
  amountCell: { width: '19%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  itemDescLine2: { fontSize: 8, marginTop: 1 },

  // Total rows
  taxRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
  },
  taxLabel: {
    width: '76%',
    padding: mm(1.5),
    fontSize: 9,
    textAlign: 'right',
    borderRight: '1px solid #000000',
  },
  taxValue: {
    width: '24%',
    padding: mm(1.5),
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderTop: '2px solid #000000',
    borderBottom: '1px solid #000000',
    fontFamily: 'Helvetica-Bold',
  },
  totalLabel: {
    width: '76%',
    padding: mm(1.5),
    fontSize: 9,
    textAlign: 'right',
    borderRight: '1px solid #000000',
  },
  totalAmount: {
    width: '24%',
    padding: mm(1.5),
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },

  // Amount in Words + Balance
  amountWordsSection: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
    minHeight: mm(14),
  },
  amountWordsLeft: {
    flex: 1,
    borderRight: '1px solid #000000',
    padding: mm(3),
    justifyContent: 'center',
  },
  amountWordsLabel: {
    fontSize: 9,
    marginBottom: mm(1),
  },
  amountWordsText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: mm(0.5),
    lineHeight: 1.2,
  },
  eoeText: {
    fontSize: 8,
    fontStyle: 'italic',
  },
  amountWordsRight: {
    width: '33%',
  },
  balanceRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
    minHeight: mm(7),
    alignItems: 'center',
  },
  balanceRowLast: {
    flexDirection: 'row',
    minHeight: mm(7),
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    padding: mm(1.5),
    paddingLeft: mm(2),
    lineHeight: 1.3,
  },
  balanceValue: {
    fontSize: 9,
    padding: mm(1.5),
    lineHeight: 1.3,
  },

  // Declaration & Bank Details
  footerSection: {
    flexDirection: 'row',
    minHeight: mm(25),
  },
  declarationSection: {
    width: '50%',
    padding: mm(3),
    borderRight: '1px solid #000000',
  },
  bankDetailsSection: {
    width: '50%',
    padding: mm(3),
  },
  declarationTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: mm(1),
  },
  declarationText: {
    fontSize: 8,
    lineHeight: 1.3,
  },
  bankDetailItem: {
    fontSize: 8,
    marginBottom: mm(1),
    lineHeight: 1.2,
  },
  signatureSection: {
    marginTop: mm(8),
    alignItems: 'flex-end',
  },
  signatureText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  signatoryText: {
    fontSize: 8,
    marginTop: mm(4),
  },

  // Footer
  footerNote: {
    textAlign: 'center',
    padding: mm(2),
    fontSize: 8,
    fontStyle: 'italic',
    borderTop: '1px solid #000000',
  },
});

const InvoicePdf: React.FC<InvoicePdfProps> = ({
  company: companyProp,
  buyer: buyerProp,
  invoiceDetails: invoiceDetailsProp,
  items: itemsProp,
  previousBalance = 0,
  bankDetails: bankDetailsProp,
  qrCode,
}) => {
  const company = {
    name: companyProp?.name ?? 'Sunshine Industries',
    address: Array.isArray(companyProp?.address) ? companyProp.address : [companyProp?.address ?? ''],
    state: companyProp?.state ?? '',
    stateCode: companyProp?.stateCode ?? '',
    contact: Array.isArray(companyProp?.contact) ? companyProp.contact : [companyProp?.contact ?? ''],
    email: companyProp?.email ?? '',
    website: companyProp?.website ?? '',
    logo: companyProp?.logo ?? companyProp?.gstin,
    gstin: companyProp?.gstin,
  };
  const buyer = {
    name: buyerProp?.name ?? 'Buyer',
    address: Array.isArray(buyerProp?.address) ? buyerProp.address : [buyerProp?.address ?? ''],
    pan: buyerProp?.pan ?? '',
    state: buyerProp?.state ?? '',
    stateCode: buyerProp?.stateCode ?? '',
    placeOfSupply: buyerProp?.placeOfSupply ?? buyerProp?.state ?? '',
    contact: buyerProp?.contact,
    email: buyerProp?.email,
    gstin: buyerProp?.gstin ?? '',
  };
  const invoiceDetails = {
    invoiceNo: invoiceDetailsProp?.invoiceNo ?? '',
    invoiceDate: invoiceDetailsProp?.invoiceDate ?? '',
    modeOfPayment: invoiceDetailsProp?.modeOfPayment ?? '',
    eWayBillNo: invoiceDetailsProp?.eWayBillNo ?? '',
    deliveryNote: invoiceDetailsProp?.deliveryNote ?? '',
    referenceNo: invoiceDetailsProp?.referenceNo ?? '',
    buyerOrderNo: invoiceDetailsProp?.buyerOrderNo ?? '',
    dispatchDocNo: invoiceDetailsProp?.dispatchDocNo ?? '',
    dispatchedThrough: invoiceDetailsProp?.dispatchedThrough ?? '',
    billOfLadingNo: invoiceDetailsProp?.billOfLadingNo ?? '',
    billOfLadingDate: invoiceDetailsProp?.billOfLadingDate ?? '',
    otherReferences: invoiceDetailsProp?.otherReferences ?? '',
    deliveryNoteDate: invoiceDetailsProp?.deliveryNoteDate ?? '',
    destination: invoiceDetailsProp?.destination ?? '',
    motorVehicleNo: invoiceDetailsProp?.motorVehicleNo ?? '',
    termsOfDelivery: invoiceDetailsProp?.termsOfDelivery ?? '',
  };
  const bankDetails = {
    accountHolderName: bankDetailsProp?.accountHolderName ?? '',
    bankName: bankDetailsProp?.bankName ?? '',
    accountNo: bankDetailsProp?.accountNo ?? '',
    branchAndIFSC: bankDetailsProp?.branchAndIFSC ?? '',
    swiftCode: bankDetailsProp?.swiftCode,
  };

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const items = (itemsProp ?? []).map((item, idx) => ({
    slNo: item?.slNo ?? idx + 1,
    description: item?.description != null ? String(item.description).trim() : '',
    hsn: item?.hsn != null ? String(item.hsn).trim() : '',
    quantity: item?.quantity != null ? String(item.quantity) : '0',
    rate: round2(Number(item?.rate) || 0),
    unit: item?.unit != null ? String(item.unit) : '',
    amount: round2(Number(item?.amount) || 0),
    boxes: item?.boxes,
    itemsPerBox: item?.itemsPerBox,
  }));

  const calculateTotals = () => {
    const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));
    const roundOff = round2(Math.round(subtotal * 100) / 100 - subtotal);
    const grandTotal = round2(subtotal + roundOff);
    const currentBalance = round2(Math.max(0, Number(previousBalance) + grandTotal));
    return { subtotal, roundOff, grandTotal, currentBalance };
  };

  const { subtotal, roundOff, grandTotal, currentBalance } = calculateTotals();

  const formatAmount = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const parts = absAmount.toFixed(2).split('.');
    const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formattedInteger}.${parts[1]}`;
  };

  const numberToWords = (amount: number): string => {
    const n = Math.round(Number(amount));
    if (!Number.isFinite(n) || n < 0) return 'INR 0 Only';
    if (n === 0) return 'INR Zero Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const twoDigits = (num: number) => (num < 20 ? ones[num] : `${tens[Math.floor(num / 10)]}${num % 10 ? ' ' + ones[num % 10] : ''}`);
    const threeDigits = (num: number) => {
      const h = Math.floor(num / 100);
      const rest = num % 100;
      return (h ? `${ones[h]} Hundred` : '') + (rest ? ` ${twoDigits(rest)}` : '');
    };
    let num = n;
    const parts: string[] = [];
    const crore = Math.floor(num / 10000000);
    if (crore) { parts.push(`${twoDigits(crore)} Crore`); num %= 10000000; }
    const lakh = Math.floor(num / 100000);
    if (lakh) { parts.push(`${twoDigits(lakh)} Lakh`); num %= 100000; }
    const thousand = Math.floor(num / 1000);
    if (thousand) { parts.push(`${twoDigits(thousand)} Thousand`); num %= 1000; }
    if (num) parts.push(threeDigits(num));
    return `INR ${parts.join(' ')} Only`;
  };

  // Logo URL - use from public folder when available
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/company-logo.png` : '/company-logo.png';

  const metaRows = [
    { left: 'Invoice No.', right: 'Dated', leftVal: invoiceDetails.invoiceNo, rightVal: invoiceDetails.invoiceDate },
    { left: 'Delivery Note', right: 'Mode/Terms of Payment', leftVal: invoiceDetails.deliveryNote ?? '', rightVal: invoiceDetails.modeOfPayment },
    { left: 'Reference No. & Date', right: 'Other References', leftVal: invoiceDetails.referenceNo ?? '', rightVal: invoiceDetails.otherReferences ?? '' },
    { left: "Buyer's Order No.", right: 'Dated', leftVal: invoiceDetails.buyerOrderNo ?? '', rightVal: '' },
    { left: 'Dispatch Doc No.', right: 'Delivery Note Date', leftVal: invoiceDetails.dispatchDocNo ?? '', rightVal: invoiceDetails.deliveryNoteDate ?? '' },
    { left: 'Dispatched through', right: 'Destination', leftVal: invoiceDetails.dispatchedThrough ?? '', rightVal: invoiceDetails.destination ?? '' },
    { left: 'Bill of Lading/LR-RR No.', right: 'Motor Vehicle No.', leftVal: invoiceDetails.billOfLadingNo ?? '', rightVal: invoiceDetails.motorVehicleNo ?? '' },
    { left: 'Terms of Delivery', right: '', leftVal: invoiceDetails.termsOfDelivery ?? '', rightVal: '' },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* BLOCK 1 - Title Bar */}
          <View style={styles.header}>
            <View style={{ width: 80 }} />
            <Text style={styles.headerTitle}>Order Estimates</Text>
          </View>

          {/* BLOCK 2 - Company & Invoice Details */}
          <View style={styles.topSection}>
            <View style={styles.leftSection}>
              <View style={styles.companyBlock}>
                <View style={styles.logoBox}>
                  <Image src={logoUrl} style={{ width: mm(18), height: mm(18) }} />
                </View>
                <View style={styles.companyDetailsBlock}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  {company.address.filter(Boolean).map((line, idx) => (
                    <Text key={idx} style={styles.companyDetail}>{line}</Text>
                  ))}
                  {company.gstin ? (
                    <Text style={styles.companyDetail}><Text style={styles.boldLabel}>GSTIN/UIN: </Text>{company.gstin}</Text>
                  ) : null}
                  {company.state ? (
                    <Text style={styles.companyDetail}><Text style={styles.boldLabel}>State Name : </Text>{company.state}, Code : {company.stateCode}</Text>
                  ) : null}
                  {company.contact.length > 0 ? (
                    <Text style={styles.companyDetail}><Text style={styles.boldLabel}>Contact : </Text>{company.contact.join(',')}</Text>
                  ) : null}
                  {company.email ? (
                    <Text style={styles.companyDetail}><Text style={styles.boldLabel}>E-Mail : </Text>{company.email}</Text>
                  ) : null}
                  {company.website ? (
                    <Text style={styles.companyDetail}>{company.website}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.buyerBlock}>
                <Text style={styles.sectionTitle}>Buyer (Bill to)</Text>
                <Text style={styles.buyerName}>{buyer.name}</Text>
                {buyer.address.filter(Boolean).map((line, idx) => (
                  <Text key={idx} style={styles.buyerDetail}>{line}</Text>
                ))}
                {buyer.pan ? (
                  <Text style={styles.buyerDetail}><Text style={styles.boldLabel}>PAN: </Text>{buyer.pan}</Text>
                ) : null}
                {buyer.state ? (
                  <Text style={styles.buyerDetail}><Text style={styles.boldLabel}>State: </Text>{buyer.state}, Code: {buyer.stateCode}</Text>
                ) : null}
                {buyer.placeOfSupply ? (
                  <Text style={styles.buyerDetail}><Text style={styles.boldLabel}>Place of Supply: </Text>{buyer.placeOfSupply}</Text>
                ) : null}
                {buyer.contact ? (
                  <Text style={styles.buyerDetail}><Text style={styles.boldLabel}>Contact: </Text>{buyer.contact}</Text>
                ) : null}
                {buyer.email ? (
                  <Text style={styles.buyerDetail}><Text style={styles.boldLabel}>Email: </Text>{buyer.email}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.rightSection}>
              {metaRows.map((row, idx) => (
                <View key={idx} style={[styles.detailRow, idx === metaRows.length - 1 ? { borderBottom: 'none' } : {}]}>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>{row.left || '\u00A0'}</Text>
                    <Text style={styles.detailValue}>{row.leftVal || '\u00A0'}</Text>
                  </View>
                  <View style={styles.detailHalfLast}>
                    <Text style={styles.detailLabel}>{row.right || '\u00A0'}</Text>
                    <Text style={styles.detailValue}>{row.rightVal || '\u00A0'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.itemsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.slNoCell]}>Sl No.</Text>
              <Text style={[styles.tableHeaderCell, styles.descriptionCell, styles.tableHeaderCellDesc]}>Description of Goods</Text>
              <Text style={[styles.tableHeaderCell, styles.totalItemsCell]}>Quantity</Text>
              <Text style={[styles.tableHeaderCell, styles.boxesCell]}>No of boxes</Text>
              <Text style={[styles.tableHeaderCell, styles.itemsPerBoxCell]}>No of item{"\n"}(per box)</Text>
              <Text style={[styles.tableHeaderCell, styles.rateCell]}>Rate{"\n"}(per item)</Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellLast, styles.amountCell]}>Amount</Text>
            </View>

            {items.map((item) => {
              const hasBoxes = item.boxes != null && item.itemsPerBox != null && Number(item.boxes) > 0 && Number(item.itemsPerBox) > 0;
              const boxesText = hasBoxes ? `${item.itemsPerBox}NOS X ${item.boxes} BOX` : '';
              return (
                <View key={item.slNo} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.slNoCell]}>{item.slNo}</Text>
                  <View style={[styles.tableCell, styles.descriptionCell]}>
                    <Text>{item.description || '—'}</Text>
                    {boxesText ? <Text style={styles.itemDescLine2}>{boxesText}</Text> : null}
                  </View>
                  <Text style={[styles.tableCell, styles.totalItemsCell]}>{hasBoxes ? (Number(item.boxes) * Number(item.itemsPerBox)) : '\u00A0'}</Text>
                  <Text style={[styles.tableCell, styles.boxesCell]}>{hasBoxes ? item.boxes : '\u00A0'}</Text>
                  <Text style={[styles.tableCell, styles.itemsPerBoxCell]}>{hasBoxes ? item.itemsPerBox : '\u00A0'}</Text>
                  <Text style={[styles.tableCell, styles.rateCell]}>{item.rate.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellLast, styles.amountCell]}>Rs. {formatAmount(item.amount)}</Text>
                </View>
              );
            })}

            {/* Subtotal */}
            <View style={styles.taxRow}>
              <Text style={[styles.tableCell, styles.slNoCell, { borderRight: '1px solid #000000' }]}>{'\u00A0'}</Text>
              <Text style={[styles.tableCell, styles.descriptionCell, { textAlign: 'right', fontFamily: 'Helvetica-Bold', borderRight: '1px solid #000000' }]}>Total</Text>
              <Text style={[styles.tableCell, styles.totalItemsCell, { textAlign: 'center', fontFamily: 'Helvetica-Bold', borderRight: '1px solid #000000' }]}>{items.reduce((sum, it) => sum + (it.boxes && it.itemsPerBox ? Number(it.boxes) * Number(it.itemsPerBox) : 0), 0) || '\u00A0'}</Text>
              <Text style={[styles.tableCell, styles.boxesCell, { textAlign: 'center', fontFamily: 'Helvetica-Bold', borderRight: '1px solid #000000' }]}>{items.reduce((sum, it) => sum + (it.boxes ? Number(it.boxes) : 0), 0) || '\u00A0'}</Text>
              <Text style={[styles.tableCell, styles.itemsPerBoxCell, { borderRight: '1px solid #000000' }]}>{'\u00A0'}</Text>
              <Text style={[styles.tableCell, styles.rateCell, { textAlign: 'right', fontFamily: 'Helvetica-Bold', borderRight: '1px solid #000000' }]}>Subtotal</Text>
              <Text style={[styles.tableCell, styles.tableCellLast, styles.amountCell, { fontFamily: 'Helvetica-Bold', fontSize: 11 }]}>Rs. {formatAmount(subtotal)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={[styles.taxLabel, { width: '76%' }]}>Round Off</Text>
              <Text style={styles.taxValue}>Rs. {formatAmount(roundOff)}</Text>
            </View>
            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalAmount}>Rs. {formatAmount(grandTotal)}</Text>
            </View>
          </View>

          {/* Amount in Words + Balance */}
          <View style={styles.amountWordsSection}>
            <View style={styles.amountWordsLeft}>
              <Text style={styles.amountWordsLabel}>Amount Chargeable (in words)</Text>
              <Text style={styles.amountWordsText}>{numberToWords(grandTotal)}</Text>
              <Text style={styles.eoeText}>E. & O.E</Text>
            </View>
            <View style={styles.amountWordsRight}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Previous Balance:</Text>
                <Text style={styles.balanceValue}>Rs. {formatAmount(Number(previousBalance))} Dr</Text>
              </View>
              <View style={styles.balanceRowLast}>
                <Text style={styles.balanceLabel}>Current Balance:</Text>
                <Text style={styles.balanceValue}>Rs. {formatAmount(Number(currentBalance))} Dr</Text>
              </View>
            </View>
          </View>

          {/* Declaration & Bank Details */}
          <View style={styles.footerSection}>
            <View style={styles.declarationSection}>
              <Text style={styles.declarationTitle}>Declaration</Text>
              <Text style={styles.declarationText}>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </Text>
            </View>
            <View style={styles.bankDetailsSection}>
              <Text style={styles.declarationTitle}>Company's Bank Details</Text>
              <Text style={styles.bankDetailItem}><Text style={styles.boldLabel}>A/c Holder's Name: </Text>{bankDetails.accountHolderName}</Text>
              <Text style={styles.bankDetailItem}><Text style={styles.boldLabel}>Bank Name: </Text>{bankDetails.bankName}</Text>
              <Text style={styles.bankDetailItem}><Text style={styles.boldLabel}>A/c No.: </Text>{bankDetails.accountNo}</Text>
              <Text style={styles.bankDetailItem}><Text style={styles.boldLabel}>Branch & IFSC: </Text>{bankDetails.branchAndIFSC}</Text>
              {bankDetails.swiftCode ? (
                <Text style={styles.bankDetailItem}><Text style={styles.boldLabel}>SWIFT Code: </Text>{bankDetails.swiftCode}</Text>
              ) : null}
              <View style={styles.signatureSection}>
                <Text style={styles.signatureText}>for {company.name}</Text>
                <Text style={styles.signatoryText}>Authorised Signatory</Text>
              </View>
            </View>
          </View>

          <View style={styles.footerNote}>
            <Text>This is a Computer Generated Invoice</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePdf;
