import React, { useState, useEffect } from 'react';
import { adminService, type AdminUser } from '../services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  UserX,
  UserCheck
} from 'lucide-react';

interface UserFilters {
  search: string;
  level: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UserDetailsModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onUserUpdate: (updatedUser: AdminUser) => void;
}

// Modal pour les détails utilisateur
function UserDetailsModal({ user, onClose, onUserUpdate }: UserDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    status: user?.status || 'active',
    level: user?.level || 'bronze',
    balanceAdjustment: 0,
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadUserDetails();
    }
  }, [user]);

  const loadUserDetails = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const details = await adminService.getUserDetails(user.id);
      setUserDetails(details);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const updatedUser = await adminService.updateUser(user.id, {
        status: editData.status as any,
        level: editData.level,
        balance_adjustment: editData.balanceAdjustment,
        notes: editData.notes
      });
      onUserUpdate(updatedUser);
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendu</Badge>;
      case 'banned':
        return <Badge variant="outline" className="border-red-500 text-red-500">Banni</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Détails de {user.username}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations du Compte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom d'utilisateur</Label>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label>Solde actuel</Label>
                    <p className="font-medium">{user.balance_pi.toFixed(2)} Pi</p>
                  </div>
                  <div>
                    <Label>Niveau</Label>
                    <Badge className="bg-pi-gold text-white">{user.level.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    {getStatusBadge(user.status)}
                  </div>
                  <div>
                    <Label>Code de parrainage</Label>
                    <p className="font-medium font-mono">{user.referral_code}</p>
                  </div>
                  <div>
                    <Label>Membre depuis</Label>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>
                  <div>
                    <Label>Dernière activité</Label>
                    <p className="font-medium">{formatDate(user.last_activity)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques financières */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques Financières</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <p className="text-2xl font-bold text-green-500">
                      {user.total_invested.toFixed(2)} Pi
                    </p>
                    <p className="text-sm text-muted-foreground">Total Investi</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-500/10">
                    <p className="text-2xl font-bold text-blue-500">
                      {user.total_claimed.toFixed(2)} Pi
                    </p>
                    <p className="text-sm text-muted-foreground">Total Réclamé</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-500/10">
                    <p className="text-2xl font-bold text-purple-500">
                      {((user.total_claimed / Math.max(user.total_invested, 1)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">ROI</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions administratives */}
            {!editMode ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions Administratives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setEditMode(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="text-yellow-500">
                          <Ban className="h-4 w-4 mr-2" />
                          Suspendre
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Suspendre l'utilisateur ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action suspendra temporairement le compte de {user.username}.
                            L'utilisateur ne pourra plus accéder à la plateforme.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleSaveChanges()}
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            Suspendre
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button 
                      variant="outline" 
                      className="text-green-500"
                      onClick={() => {
                        setEditData({ ...editData, status: 'active' });
                        handleSaveChanges();
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Réactiver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Modifier l'Utilisateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select value={editData.status} onValueChange={(value: 'active' | 'suspended' | 'banned') => setEditData({ ...editData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="suspended">Suspendu</SelectItem>
                            <SelectItem value="banned">Banni</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="level">Niveau</Label>
                        <Select value={editData.level} onValueChange={(value) => setEditData({ ...editData, level: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Argent</SelectItem>
                            <SelectItem value="gold">Or</SelectItem>
                            <SelectItem value="platinum">Platine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="balanceAdjustment">Ajustement de Solde (Pi)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editData.balanceAdjustment}
                        onChange={(e) => setEditData({ ...editData, balanceAdjustment: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Valeur positive pour ajouter, négative pour retirer
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes administratives</Label>
                      <Textarea
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        placeholder="Raison de la modification..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveChanges} disabled={isLoading}>
                        {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Sauvegarder
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Composant principal de gestion des utilisateurs
export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    level: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadUsers();
  }, [pagination.current_page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: filters.search || undefined,
        level: filters.level || undefined,
        status: filters.status || undefined,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      });
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: AdminUser) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><UserCheck className="h-3 w-3 mr-1" />Actif</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" />Suspendu</Badge>;
      case 'banned':
        return <Badge variant="outline" className="border-red-500 text-red-500"><Ban className="h-3 w-3 mr-1" />Banni</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Administrer les comptes utilisateurs de la plateforme Pi Staking
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, email, ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="level">Niveau</Label>
              <Select value={filters.level} onValueChange={(value) => setFilters({ ...filters, level: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les niveaux</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Argent</SelectItem>
                  <SelectItem value="gold">Or</SelectItem>
                  <SelectItem value="platinum">Platine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="banned">Banni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Tri</Label>
              <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Plus récents</SelectItem>
                  <SelectItem value="created_at-asc">Plus anciens</SelectItem>
                  <SelectItem value="username-asc">Nom A-Z</SelectItem>
                  <SelectItem value="username-desc">Nom Z-A</SelectItem>
                  <SelectItem value="balance_pi-desc">Solde décroissant</SelectItem>
                  <SelectItem value="balance_pi-asc">Solde croissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Utilisateurs ({pagination.total})</span>
            <Badge variant="outline">{users.length} sur {pagination.total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Total Investi</TableHead>
                    <TableHead>Membre depuis</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-pi-gold text-white">
                          {user.level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{formatCurrency(user.balance_pi)} Pi</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{formatCurrency(user.total_invested)} Pi</span>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.current_page} sur {pagination.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                    disabled={pagination.current_page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                    disabled={pagination.current_page === pagination.last_page}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal des détails utilisateur */}
      <UserDetailsModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}