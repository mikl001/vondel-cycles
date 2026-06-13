import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { OrderConfirmation } from "@/lib/orders/server";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1d3728" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#2a523b" },
  demo: { fontSize: 8, color: "#9ca3af", marginTop: 4 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  row: { flexDirection: "row", borderBottom: "1 solid #e0ece2", paddingVertical: 5 },
  headerRow: {
    flexDirection: "row",
    borderBottom: "1.5 solid #2a523b",
    paddingVertical: 5,
    fontFamily: "Helvetica-Bold",
  },
  colDesc: { flex: 5 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colVat: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1.5 solid #2a523b",
    marginTop: 4,
    paddingTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

const eur = (cents: number) =>
  `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export function InvoiceDocument({
  order,
  locale,
}: {
  order: OrderConfirmation;
  locale: "nl" | "en";
}) {
  const nl = locale === "nl";
  const subtotalAfterDiscount =
    order.subtotalExclCents - order.promoDiscountCents;

  return (
    <Document
      title={`Factuur ${order.orderNumber}`}
      author="Vondel Cycles (demo)"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Vondel Cycles</Text>
            <Text>Vondelstraat 1, 1071 AA Amsterdam</Text>
            <Text>KvK 00000000 · BTW NL000000000B00 (fictief)</Text>
            <Text style={styles.demo}>
              {nl
                ? "Demo-factuur — geen echte transactie"
                : "Demo invoice — not a real transaction"}
            </Text>
          </View>
          <View>
            <Text style={styles.h2}>{nl ? "Factuur" : "Invoice"}</Text>
            <Text>{order.orderNumber}</Text>
            <Text>{new Date().toISOString().slice(0, 10)}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.h2}>{nl ? "Factuuradres" : "Billing address"}</Text>
          <Text>
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </Text>
          <Text>
            {order.shippingAddress.street} {order.shippingAddress.houseNumber}
            {order.shippingAddress.addition ? ` ${order.shippingAddress.addition}` : ""}
          </Text>
          <Text>
            {order.shippingAddress.postcode} {order.shippingAddress.city}
          </Text>
          <Text>{order.email}</Text>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.colDesc}>{nl ? "Omschrijving" : "Description"}</Text>
          <Text style={styles.colQty}>{nl ? "Aantal" : "Qty"}</Text>
          <Text style={styles.colPrice}>{nl ? "Prijs (excl.)" : "Price (excl.)"}</Text>
          <Text style={styles.colVat}>{nl ? "Btw" : "VAT"}</Text>
          <Text style={styles.colTotal}>{nl ? "Totaal (excl.)" : "Total (excl.)"}</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.sku} style={styles.row}>
            <Text style={styles.colDesc}>
              {item.productName[locale] ?? item.productName.nl} ({item.sku})
            </Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{eur(item.unitPriceExclCents)}</Text>
            <Text style={styles.colVat}>{item.vatRate}%</Text>
            <Text style={styles.colTotal}>
              {eur(item.unitPriceExclCents * item.quantity)}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>{nl ? "Subtotaal (excl. btw)" : "Subtotal (excl. VAT)"}</Text>
            <Text>{eur(order.subtotalExclCents)}</Text>
          </View>
          {order.promoDiscountCents > 0 && (
            <View style={styles.totalRow}>
              <Text>{nl ? "Korting" : "Discount"}</Text>
              <Text>-{eur(order.promoDiscountCents)}</Text>
            </View>
          )}
          {order.shippingCostCents > 0 && (
            <View style={styles.totalRow}>
              <Text>{nl ? "Verzending (excl.)" : "Shipping (excl.)"}</Text>
              <Text>{eur(order.shippingCostCents)}</Text>
            </View>
          )}
          {order.promoDiscountCents > 0 && (
            <View style={styles.totalRow}>
              <Text>{nl ? "Belastbaar bedrag" : "Taxable amount"}</Text>
              <Text>{eur(subtotalAfterDiscount + order.shippingCostCents)}</Text>
            </View>
          )}
          {Object.entries(order.vatBreakdown)
            // under reverse charge VAT is 0 — the notice below carries it, so
            // suppress the redundant 'VAT 21% EUR 0,00' rows
            .filter(([, cents]) => !order.reverseCharge && cents > 0)
            .map(([rate, cents]) => (
              <View key={rate} style={styles.totalRow}>
                <Text>{nl ? `Btw ${rate}%` : `VAT ${rate}%`}</Text>
                <Text>{eur(cents)}</Text>
              </View>
            ))}
          {order.reverseCharge && (
            <View style={styles.totalRow}>
              <Text>
                {nl ? "Btw verlegd (art. 138 EU-richtlijn)" : "VAT reverse-charged (intra-EU)"}
              </Text>
              <Text>€ 0,00</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text>{nl ? "Totaal" : "Total"}</Text>
            <Text>{eur(order.totalInclCents)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Vondel Cycles is een fictieve demo-webshop voor portfolio-doeleinden. /
          Vondel Cycles is a fictional demo webshop for portfolio purposes.
        </Text>
      </Page>
    </Document>
  );
}
