'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';

export default function BailPage() {
  const params = useParams();
  const id = params.id as string;

  const [bien, setBien] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBienDetails();
    }
  }, [id]);

  // Fonction pour enregistrer le bail dans Supabase et lancer l'impression
async function handlePrintAndSave() {
  try {
    const tenantName = `${tenant.tenant_first_name}_${tenant.tenant_last_name}`.replace(/\s+/g, '');
    const propertyName = bien.street_name?.replace(/\s+/g, '_') || 'Logement';
    const date = new Date().toISOString().split('T')[0];
    
    const fileName = `Bail_${propertyName}_${tenantName}_${date}.pdf`;

    const { error } = await supabase.from('documents').insert([
      {
        property_id: bien.id,
        rental_id: tenant.id, // On lie le document au locataire de l'époque
        file_name: fileName,
        document_type: 'Bail' 
      },
    ]);

    if (error) {
      console.error("Erreur lors de l'enregistrement dans la table documents :", error);
    }
  } catch (error) {
    console.error("Erreur d'exécution :", error);
  }

  window.print();
}

// 1. Nouvel état pour stocker le propriétaire
const [owner, setOwner] = useState<any>(null);

// 2. Fonction pour récupérer le profil (à ajouter plus tard quand l'Auth sera en place)
async function fetchOwnerProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setOwner(profile);
  }
}

  async function fetchBienDetails() {
    const { data, error } = await supabase
      .from('properties')
      .select('*, rentals(*)')
      .eq('id', id)
      .single();

    if (data) {
      setBien(data);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement du bail...</div>;
  if (!bien) return <div className="p-8 text-center text-red-500">Bien non trouvé.</div>;

  const tenant = bien.rentals && bien.rentals.length > 0 ? bien.rentals[0] : null;

  if (!tenant) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p>Ce bien n'a aucun locataire enregistré. Impossible de générer un bail.</p>
        <Link href={`/bien/${id}`} className="text-blue-600 underline mt-4 inline-block">
          &larr; Retour au bien
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      {/* Barre d'action supérieure (Masquée à l'impression) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/bien/${id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          &larr; Retour à la fiche du bien
        </Link>
        <button
        onClick={handlePrintAndSave}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow transition-colors text-sm"
        >
        🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>

      {/* Document du Bail (Format A4 stylisé) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg rounded-xl print:shadow-none print:p-0 print:max-w-none text-slate-800 text-sm leading-relaxed space-y-6">
        
        <header className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
            CONTRAT DE LOCATION D'HABITATION
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Soumis au régime de la loi n° 89-462 du 6 juillet 1989 modifiée
          </p>
        </header>

        {/* Désignation des parties */}
        <section className="space-y-3">
          <h2 className="font-bold border-b text-base text-slate-900 pb-1">I. DÉSIGNATION DES PARTIES</h2>
          
          <div className="bg-slate-50 p-3 rounded border print:bg-transparent print:border-none">
            <p className="font-semibold text-slate-900">Le Bailleur / Le Propriétaire :</p>
            <p>{owner?.first_name} {owner?.last_name}</p>
            <p>Demeurant à : {owner?.address}</p>
            <p>Téléphone : {owner?.phone}</p>
            <p>Email : {owner?.email}</p>
            </div>

          <div className="bg-slate-50 p-3 rounded border print:bg-transparent print:border-none">
            <p className="font-semibold text-slate-900">Le(s) Locataire(s) :</p>
            <p className="font-bold">{tenant.tenant_first_name} {tenant.tenant_last_name}</p>
            {tenant.tenant2_first_name && (
              <p className="font-bold">{tenant.tenant2_first_name} {tenant.tenant2_last_name}</p>
            )}
            <p>Adresse email : {tenant.tenant_email}</p>
          </div>
        </section>

        {/* Objet du contrat */}
        <section className="space-y-2">
          <h2 className="font-bold border-b text-base text-slate-900 pb-1">II. OBJET DU CONTRAT</h2>
          <p>
            Le bailleur donne en location au locataire le logement situé à l'adresse suivante :
          </p>
          <div className="p-3 bg-slate-50 rounded border print:bg-transparent">
            <p className="font-semibold">
              {bien.street_number ? `${bien.street_number} ` : ''}{bien.street_name}
            </p>
            {bien.property_type === 'Appartement' && (
              <p>
                {[
                  bien.building_number ? `Bâtiment ${bien.building_number}` : null,
                  bien.floor ? `Étage ${bien.floor}` : null,
                  bien.apartment_number ? `Appartement ${bien.apartment_number}` : null,
                ].filter(Boolean).join(' - ')}
              </p>
            )}
            <p>{bien.city} ({bien.department})</p>
            <p className="mt-1 text-xs text-slate-600">Type de bien : <strong>{bien.property_type}</strong></p>
          </div>
        </section>

        {/* Conditions financières */}
        <section className="space-y-2">
          <h2 className="font-bold border-b text-base text-slate-900 pb-1">III. CONDITIONS FINANCIÈRES</h2>
          <p>
            Le loyer mensuel hors charges est fixé à : <strong>{bien.base_rent_price} €</strong>.
          </p>
          <p>
            Montant de la provision mensuelle sur charges : <strong>{bien.service_charges || 0} €</strong>.
          </p>
          <p className="font-semibold">
            Loyer total mensuel charges comprises : {(parseFloat(bien.base_rent_price) + parseFloat(bien.service_charges || 0)).toFixed(2)} €
          </p>
        </section>

        {/* Durée du contrat */}
        <section className="space-y-2">
          <h2 className="font-bold border-b text-base text-slate-900 pb-1">IV. DATE DE PRISE D'EFFET</h2>
          <p>
            Le présent contrat prend effet le : <strong>{new Date(tenant.entry_date).toLocaleDateString('fr-FR')}</strong>.
          </p>
        </section>

        {/* Signatures */}
        <section className="pt-8 grid grid-cols-2 gap-8 text-center">
          <div>
            <p className="font-semibold">Fait à ........................, le ..................</p>
            <p className="mt-2 text-xs italic">Signature du (des) Bailleur(s)</p>
            <div className="h-20 border mt-2 rounded"></div>
          </div>
          <div>
            <p className="font-semibold">Signature du (des) Locataire(s)</p>
            <p className="mt-2 text-xs italic">(Précédée de la mention "Lu et approuvé")</p>
            <div className="h-20 border mt-2 rounded"></div>
          </div>
        </section>

      </div>
    </main>
  );
}