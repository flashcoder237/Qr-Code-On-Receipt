// src/components/organisms/centre-manager/CentreList.tsx
// Liste affichant les centres sous forme de grille de cards

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { Centre } from '@/lib/form-schemas/centre-settings';

interface CentreListProps {
  centres: Centre[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const CentreList: React.FC<CentreListProps> = ({
  centres,
  onSelect,
  onDelete,
  onDuplicate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {centres.map((centre) => (
        <Card key={centre.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {centre.logo ? (
                  <img
                    src={centre.logo}
                    alt={centre.nameFrench}
                    className="w-16 h-16 object-contain mb-3 rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mb-3">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <CardTitle className="text-lg mb-1">{centre.nameFrench}</CardTitle>
                <CardDescription className="text-sm italic">
                  {centre.nameEnglish}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                {centre.isActive ? (
                  <Badge variant="default" className="text-xs">
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Inactif
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Instance administrative */}
            {centre.administrativeInstanceNameFr && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Instance administrative:
                </p>
                <p className="text-sm font-semibold">
                  {centre.administrativeInstanceNameFr}
                </p>
                {centre.administrativeInstanceNameEn && (
                  <p className="text-xs text-muted-foreground italic">
                    {centre.administrativeInstanceNameEn}
                  </p>
                )}
              </div>
            )}

            {/* Coordonnées */}
            <div className="space-y-2 mb-4">
              {centre.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{centre.location}</span>
                </div>
              )}
              {centre.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{centre.phone}</span>
                </div>
              )}
              {centre.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{centre.email}</span>
                </div>
              )}
            </div>

            {/* Arrêté */}
            {centre.authorizationTextFr && (
              <div className="mb-4 p-2 bg-muted rounded text-xs">
                <p className="line-clamp-2">{centre.authorizationTextFr}</p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <Button
                onClick={() => onSelect(centre.id)}
                variant="default"
                size="sm"
                className="flex-1 gap-2"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => onDuplicate(centre.id)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onDelete(centre.id)}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Métadonnées */}
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              Créé le {new Date(centre.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CentreList;
