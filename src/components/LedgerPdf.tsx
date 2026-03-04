import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface CompanyDetails {
  name: string;
  address: string[];
  state: string;
  stateCode: string;
  contact: string[];
  email: string;
  website: string;
}

interface BuyerDetails {
  name: string;
  address: string[];
}

export interface LedgerTransaction {
  date: string; // display string
  dateDate: Date; // for sorting and filtering
  particulars: string;
  vchType: string;
  vchNo: string;
  debit: number | null;
  credit: number | null;
}

interface LedgerPdfProps {
  company: CompanyDetails;
  buyer: BuyerDetails;
  transactions: LedgerTransaction[];
  startDate?: Date;
  endDate?: Date;
  openingBalance: number;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  headerCentered: { textAlign: 'center', marginBottom: 10 },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 14, marginBottom: 2 },
  companyDetails: { fontSize: 10, marginBottom: 1 },
  buyerName: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginTop: 10, marginBottom: 2 },
  ledgerAccountText: { fontSize: 10, marginBottom: 2 },
  dateRangeText: { fontSize: 10, marginTop: 10, marginBottom: 15 },
  table: { width: '100%', margin: 0, padding: 0 },
  tableRow: { flexDirection: 'row' },
  tableHeader: { backgroundColor: '#f5f5f5', borderBottom: '1px solid #000000', borderTop: '1px solid #000000' },
  colDate: { width: '15%', padding: 4 },
  colParticulars: { width: '30%', padding: 4 },
  colVchType: { width: '15%', padding: 4, textAlign: 'center' },
  colVchNo: { width: '15%', padding: 4, textAlign: 'right' },
  colDebit: { width: '12.5%', padding: 4, textAlign: 'right' },
  colCredit: { width: '12.5%', padding: 4, textAlign: 'right' },
  boldCell: { fontFamily: 'Helvetica-Bold' },
  pageNumberBox: { width: '100%', textAlign: 'right', fontSize: 8, marginBottom: 2 }
});

const formatAmount = (amount: number | null | undefined): string => {
  if (amount == null || amount === 0) return ' ';
  const absAmount = Math.abs(amount);
  const parts = absAmount.toFixed(2).split('.');
  const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formattedInteger}.${parts[1]}`;
};

const formatDateDisplay = (date: Date): string => {
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

const LedgerPdf: React.FC<LedgerPdfProps> = ({
  company,
  buyer,
  transactions,
  startDate,
  endDate,
  openingBalance
}) => {
  const isOpeningDebit = openingBalance >= 0;
  const absOpeningBalance = Math.abs(openingBalance);

  let totalDebit = openingBalance >= 0 ? openingBalance : 0;
  let totalCredit = openingBalance < 0 ? Math.abs(openingBalance) : 0;

  transactions.forEach(t => {
    if (t.debit) totalDebit += t.debit;
    if (t.credit) totalCredit += t.credit;
  });

  const closingBalance = totalDebit - totalCredit;
  const isClosingDebit = closingBalance > 0;

  const grandTotal = Math.max(totalDebit, totalCredit);

  const dateRangeStr = (startDate && endDate)
    ? `${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`
    : (startDate ? `From ${formatDateDisplay(startDate)}` : (endDate ? `Up to ${formatDateDisplay(endDate)}` : 'All Time'));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerCentered}>
          <Text style={styles.companyName}>{company.name || ' '}</Text>
          {company.address.filter(line => line && line.trim() !== '').map((line, idx) => (
            <Text key={idx} style={styles.companyDetails}>{line}</Text>
          ))}
          <Text style={styles.companyDetails}>
            Contact : {(company.contact || []).join(', ')}
          </Text>
          <Text style={styles.companyDetails}>E-Mail : {company.email || ' '}</Text>
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#000000', paddingBottom: 5, marginBottom: 5, width: '100%', alignItems: 'center' }}>
            <Text style={styles.companyDetails}>{company.website || ' '}</Text>
          </View>

          <Text style={styles.buyerName}>{buyer.name || ' '}</Text>
          <Text style={styles.ledgerAccountText}>Ledger Account</Text>
          {buyer.address.filter(line => line && line.trim() !== '').map((line, idx) => (
            <Text key={idx} style={styles.companyDetails}>{line}</Text>
          ))}

          <Text style={styles.dateRangeText}>{dateRangeStr}</Text>
        </View>

        <Text style={styles.pageNumberBox} render={({ pageNumber }) => (`Page ${pageNumber}`)} fixed />

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.colDate, styles.boldCell]}>Date</Text>
            <Text style={[styles.colParticulars, styles.boldCell]}>Particulars</Text>
            <Text style={[styles.colVchType, styles.boldCell]}>Vch Type</Text>
            <Text style={[styles.colVchNo, styles.boldCell]}>Vch No.</Text>
            <Text style={[styles.colDebit, styles.boldCell]}>Debit</Text>
            <Text style={[styles.colCredit, styles.boldCell]}>Credit</Text>
          </View>

          {/* Opening Balance Row */}
          <View style={styles.tableRow}>
            <Text style={styles.colDate}>{startDate ? formatDateDisplay(startDate) : ' '}</Text>
            <Text style={[styles.colParticulars, styles.boldCell]}>To   Opening Balance</Text>
            <Text style={styles.colVchType}>{" "}</Text>
            <Text style={styles.colVchNo}>{" "}</Text>
            <Text style={[styles.colDebit, styles.boldCell]}>{isOpeningDebit ? formatAmount(absOpeningBalance) : ' '}</Text>
            <Text style={[styles.colCredit, styles.boldCell]}>{!isOpeningDebit ? formatAmount(absOpeningBalance) : ' '}</Text>
          </View>

          {/* Transactions */}
          {transactions.map((t, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDate}>{t.date || ' '}</Text>
              <Text style={[styles.colParticulars, styles.boldCell]}>
                {`${t.debit ? 'To   ' : 'By   '} ${t.particulars || ''}`}
              </Text>
              <Text style={[styles.colVchType, styles.boldCell]}>{t.vchType || ' '}</Text>
              <Text style={styles.colVchNo}>{t.vchNo || ' '}</Text>
              <Text style={styles.colDebit}>{formatAmount(t.debit)}</Text>
              <Text style={styles.colCredit}>{formatAmount(t.credit)}</Text>
            </View>
          ))}

          {/* Subtotals (Row 1) */}
          <View style={styles.tableRow}>
            <Text style={styles.colDate}>{" "}</Text>
            <Text style={styles.colParticulars}>{" "}</Text>
            <Text style={styles.colVchType}>{" "}</Text>
            <Text style={styles.colVchNo}>{" "}</Text>
            <Text style={[styles.colDebit, { borderTop: '1px solid #000' }]}>{formatAmount(totalDebit)}</Text>
            <Text style={[styles.colCredit, { borderTop: '1px solid #000' }]}>{formatAmount(totalCredit)}</Text>
          </View>

          {/* Closing Balance (Row 2) */}
          <View style={styles.tableRow}>
            <Text style={styles.colDate}>{" "}</Text>
            <Text style={[styles.colParticulars, styles.boldCell]}>By Closing Balance</Text>
            <Text style={styles.colVchType}>{" "}</Text>
            <Text style={styles.colVchNo}>{" "}</Text>
            <Text style={styles.colDebit}>{" "}</Text>
            <Text style={styles.colCredit}>{formatAmount(Math.abs(closingBalance))}</Text>
          </View>

          {/* Grand Totals (Row 3) */}
          <View style={styles.tableRow}>
            <Text style={styles.colDate}>{" "}</Text>
            <Text style={styles.colParticulars}>{" "}</Text>
            <Text style={styles.colVchType}>{" "}</Text>
            <Text style={styles.colVchNo}>{" "}</Text>
            <Text style={[styles.colDebit, styles.boldCell, { borderTop: '1px solid #000', borderBottom: '1px solid #000' }]}>{formatAmount(totalDebit)}</Text>
            <Text style={[styles.colCredit, styles.boldCell, { borderTop: '1px solid #000', borderBottom: '1px solid #000' }]}>{formatAmount(totalCredit + closingBalance)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default LedgerPdf;
