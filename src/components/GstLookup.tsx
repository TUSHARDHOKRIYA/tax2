import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/data/mockData';
import { Building2, Search, CheckCircle, Clock, IndianRupee, ArrowRight, X } from 'lucide-react';
import { formatISTDate } from '@/lib/dateUtils';

interface GstLookupProps {
  selectedCompany: Company | null;
  onSelectCompany: (company: Company | null) => void;
  companies: Company[];
}

const GstLookup = ({ selectedCompany, onSelectCompany, companies }: GstLookupProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gstNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCompany = (company: Company) => {
    onSelectCompany(company);
    setSearchTerm('');
    setIsSearching(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSelectCompany(null);
    setIsSearching(false);
    setHighlightedIndex(-1);
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          Customer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="gst-input"
                placeholder="Search by company name or GST..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearching(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setIsSearching(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsSearching(false);
                    setHighlightedIndex(-1);
                    return;
                  }
                  if (!isSearching || !searchTerm || filteredCompanies.length === 0) return;

                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                      prev < filteredCompanies.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
                    handleSelectCompany(filteredCompanies[idx]);
                  }
                }}
                className="pl-9"
              />
            </div>
            {selectedCompany && (
              <Button variant="outline" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Dropdown */}
          {isSearching && searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company, index) => (
                  <button
                    key={company.id}
                    className={`w-full text-left px-4 py-3 border-b last:border-0 transition-all flex items-center justify-between group ${index === highlightedIndex ? 'bg-primary/10' : 'hover:bg-secondary/50'
                      }`}
                    onClick={() => handleSelectCompany(company)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div>
                      <p className={`text-sm font-semibold transition-colors ${index === highlightedIndex ? 'text-primary' : 'group-hover:text-primary'
                        }`}>{company.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{company.gstNo}</p>
                    </div>
                    <ArrowRight className={`h-4 w-4 transition-all ${index === highlightedIndex ? 'text-primary translate-x-1' : 'text-muted-foreground group-hover:text-primary group-hover:translate-x-1'
                      }`} />
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No matching companies found
                </div>
              )}
            </div>
          )}
        </div>

        {selectedCompany && (
          <div className="rounded-lg border bg-secondary/30 p-4 space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-foreground">{selectedCompany.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedCompany.address}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCompany.state} ({selectedCompany.stateCode})
                </p>
              </div>
              <Badge variant="outline" className="font-mono">
                <CheckCircle className="h-3 w-3 mr-1 text-success" />
                Selected
              </Badge>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t">
              {selectedCompany.pendingAmount > 0 ? (
                <div className="flex items-center gap-2 text-warning">
                  <IndianRupee className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Pending: ₹{selectedCompany.pendingAmount.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">No pending dues</span>
                </div>
              )}

              {selectedCompany.lastTransaction && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Last: {formatISTDate(selectedCompany.lastTransaction)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GstLookup;
