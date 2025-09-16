import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlowCard } from './GlowCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { userService } from '@/services/dashboardService';
import { transactionsService } from '@/services/transactionsService';
import { 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference_id: string | null;
  created_at: string;
  processed_at: string | null;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construire les paramètres de requête
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await userService.getTransactionHistory(page);
      
      if (response.success && response.data) {
        setTransactions(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError(response.message || 'Erreur lors du chargement de l\'historique');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Transaction history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, typeFilter, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchTransactions(1);
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSearch = () => {
    fetchTransactions(1);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchTransactions(currentPage);
  };

  const exportTransactions = () => {
    // Simple CSV export using current data
    const headers = ['Type', 'Description', 'Montant', 'Date', 'Statut', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        getTypeLabel(t.type),
        `"${t.description}"`,
        t.amount,
        formatDate(t.created_at),
        t.status,
        t.reference_id || t.id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'claim':
      case 'bonus':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
      case 'stake':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Terminée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'stake': 'Investment',
      'claim': 'Réclamation',
      'withdrawal': 'Retrait',
      'deposit': 'Dépôt',
      'bonus': 'Bonus',
      'referral': 'Parrainage'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <GlowCard>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historique des Transactions</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={exportTransactions}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="stake">Investment</SelectItem>
                <SelectItem value="claim">Réclamation</SelectItem>
                <SelectItem value="withdrawal">Retrait</SelectItem>
                <SelectItem value="deposit">Dépôt</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="pending">En cours</SelectItem>
                <SelectItem value="failed">Échec</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-4" />
              <span>Chargement des transactions...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center p-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                Réessayer
              </Button>
            </div>
          )}

          {/* Transactions Table */}
          {!isLoading && !error && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <Badge variant="outline">
                              {getTypeLabel(transaction.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className={transaction.amount >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} Pi
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(transaction.created_at)}</div>
                            {transaction.processed_at && (
                              <div className="text-muted-foreground text-xs">
                                Traité: {formatDate(transaction.processed_at)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {transaction.reference_id || transaction.id}
                          </code>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {((pagination.current_page - 1) * pagination.per_page) + 1} à{' '}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur{' '}
                    {pagination.total} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      Précédent
                    </Button>
                    <span className="text-sm">
                      Page {pagination.current_page} sur {pagination.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                      disabled={currentPage >= pagination.last_page}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </GlowCard>
    </div>
  );
}