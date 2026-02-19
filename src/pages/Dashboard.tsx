import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    LayoutDashboard,
    FileText,
    AreaChart,
    History,
    Sparkles,
    Wallet,
    Edit3,
    FileSpreadsheet,
    FileText as StatementIcon,
    Bell,
    BarChart3,
    Receipt,
    RefreshCw,
    MessageSquareQuote,
    Truck,
    Users,
} from "lucide-react";

const upcomingFeatures = [
    {
        title: "Record payment / Mark as paid",
        description: "Enter amount received and mark invoices as paid from History or Sales Report. Updates company balance automatically.",
        priority: "High" as const,
        icon: Wallet,
    },
    {
        title: "Edit draft invoice",
        description: "Edit or delete draft invoices—change items, amounts, or customer—before sending.",
        priority: "High" as const,
        icon: Edit3,
    },
    {
        title: "Export reports",
        description: "Export monthly sales report and outstanding balances to Excel or CSV for accounting and sharing.",
        priority: "Medium" as const,
        icon: FileSpreadsheet,
    },
    {
        title: "Customer statement PDF",
        description: "Generate a single PDF per company with all invoices and running balance (statement of account).",
        priority: "Medium" as const,
        icon: StatementIcon,
    },
    {
        title: "Due date reminders",
        description: "See overdue invoices at a glance and get a “due in 7 days” list so nothing slips.",
        priority: "Medium" as const,
        icon: Bell,
    },
    {
        title: "Key metrics on home",
        description: "Summary cards on this dashboard: today’s and this month’s sales, total outstanding, overdue count.",
        priority: "Medium" as const,
        icon: BarChart3,
    },
    {
        title: "Recurring invoices",
        description: "Create repeat invoices (e.g. monthly) for the same customer and items automatically.",
        priority: "Lower" as const,
        icon: RefreshCw,
    },
    {
        title: "Quotes / estimates",
        description: "Create quotes with a “Convert to invoice” action so you don’t re-enter data.",
        priority: "Lower" as const,
        icon: MessageSquareQuote,
    },
    {
        title: "E-invoicing / e-way",
        description: "Integrate e-invoicing and e-way bill APIs when required by law.",
        priority: "Lower" as const,
        icon: Truck,
    },
];

const priorityColors = {
    High: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    Lower: "bg-muted text-muted-foreground border-border",
} as const;

export default function Dashboard() {
    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <header>
                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    Dashboard
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Welcome back. Quick access and upcoming improvements.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/dashboard/company">
                    <Card className="invoice-card hover:border-primary/40 transition-colors h-full">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Create Invoice</p>
                                <p className="text-sm font-semibold text-foreground">New invoice</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/dashboard/sales-report">
                    <Card className="invoice-card hover:border-primary/40 transition-colors h-full">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <AreaChart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Sales Report</p>
                                <p className="text-sm font-semibold text-foreground">Insights & trends</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/dashboard/history">
                    <Card className="invoice-card hover:border-primary/40 transition-colors h-full">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <History className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">History</p>
                                <p className="text-sm font-semibold text-foreground">All invoices</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link to="/dashboard/company">
                    <Card className="invoice-card hover:border-primary/40 transition-colors h-full">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Customers</p>
                                <p className="text-sm font-semibold text-foreground">Manage companies</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <section>
                <Card className="invoice-card overflow-hidden border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Upcoming features
                        </CardTitle>
                        <CardDescription>
                            Planned improvements to make invoicing and reporting even better. Prioritised by impact.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {upcomingFeatures.map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <Card
                                        key={i}
                                        className="bg-muted/30 border-border hover:bg-muted/50 transition-colors"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {feature.title}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-medium ${priorityColors[feature.priority]}`}
                                                        >
                                                            {feature.priority}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
