'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase'; // 3 niveaux pour remonter à la racine

export default function BienDetail() {
  const params = useParams();
  const id = params.id as string;

  const [bien, setBien] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBienDetails();
    }
  }, [id]);

  async function fetchBienDetails() {
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select('*, rentals(*)')
      .eq('id', id)
      .single();

    console.log("Objet bien récupéré de Supabase :", propertyData); // <-- Ajoute ceci

    const { data: docsData } = await supabase
      .from('documents')
      .select('*')
      .eq('property_id', id)
      .order('created_at', { ascending: false });

    if (propertyData) {
      setBien(propertyData);
      setDocuments(docsData || []);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des détails...</div>;
  if (!bien) return <div className="p-8 text-center text-red-500">Bien introuvable.</div>;

  const activeTenant = bien.rentals && bien.rentals.length > 0 ? bien.rentals[0] : null;
  const bails = documents.filter(d => d.document_type === 'Bail');
  const quittances = documents.filter(d => d.document_type === 'Quittance');

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">
          &larr; Retour au tableau de bord
        </Link>

        <header className="flex justify-between items-end pb-4 border-b border-slate-200">
          <div>
            <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {bien.property_type}
            </span>
            
            {/* Affichage intelligent de la rue et du numéro */}
            <h1 className="text-3xl font-bold text-slate-900">
              {bien.street_number ? `${bien.street_number} ` : ''}{bien.street_name}
            </h1>

            {/* Détails supplémentaires affichés uniquement si c'est un appartement */}
            {bien.property_type === 'Appartement' && (
              <p className="text-sm text-slate-600 mt-1">
                {[
                  bien.building_number ? `Bât. ${bien.building_number}` : null,
                  bien.floor ? `Étage ${bien.floor}` : null,
                  bien.apartment_number ? `Apt ${bien.apartment_number}` : null,
                ].filter(Boolean).join(' • ')}
              </p>
            )}

            <p className="text-sm text-slate-500 mt-0.5">
              {bien.city} ({bien.department})
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Loyer Mensuel</p>
            <p className="text-2xl font-bold text-slate-900">{bien.base_rent_price} € <span className="text-sm font-normal text-slate-500">+ {bien.service_charges}€ ch.</span></p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Colonne Gauche : Infos Locataire */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Location actuelle</h2>
              {activeTenant ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Locataire(s)</p>
                    <p className="font-medium text-slate-900">
                      {activeTenant.tenant_first_name} {activeTenant.tenant_last_name}
                    </p>
                    {activeTenant.tenant2_first_name && (
                      <p className="font-medium text-slate-900">
                        {activeTenant.tenant2_first_name} {activeTenant.tenant2_last_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Contact</p>
                    <p className="text-slate-900">{activeTenant.tenant_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Début du bail</p>
                    <p className="text-slate-900">{new Date(activeTenant.entry_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p>Aucun locataire actuel.</p>
                  <button className="mt-3 text-sm text-blue-600 hover:underline">Ajouter un locataire</button>
                </div>
              )}
            </div>
          </div>

          {/* Colonnes Droite : Documents */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Section Bail */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Bail</h2>
                <button className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                  Générer le bail
                </button>
              </div>
              {bails.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">Aucun bail généré pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {bails.map(doc => (
                    <li key={doc.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50">
                      <span className="text-sm font-medium text-slate-700">{doc.file_name}</span>
                      <button className="text-sm text-blue-600 hover:underline">Télécharger</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Section Quittances */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Historique des Quittances</h2>
                <button className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium">
                  Nouvelle quittance
                </button>
              </div>
              {quittances.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">Aucune quittance générée.</p>
              ) : (
                <ul className="space-y-2">
                  {quittances.map(doc => (
                    <li key={doc.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-slate-700">{doc.file_name}</span>
                        <span className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="space-x-3">
                        <button className="text-sm text-blue-600 hover:underline">Voir</button>
                        <button className="text-sm text-emerald-600 hover:underline">Renvoyer</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}