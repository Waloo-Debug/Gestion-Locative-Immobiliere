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
  const tenant = bien?.rentals?.[0] || null;

  // États pour la gestion du locataire et du statut
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [t1FirstName, setT1FirstName] = useState('');
  const [t1LastName, setT1LastName] = useState('');
  const [t2FirstName, setT2FirstName] = useState('');
  const [t2LastName, setT2LastName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tEntryDate, setTEntryDate] = useState('');

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

  // Mettre à jour le statut du bien (Vacant, Loué, Vendu)
  async function handleStatusChange(newStatus: string) {
    if (newStatus === bien.status) return;

    // Met à jour la table properties
    await supabase.from('properties').update({ status: newStatus }).eq('id', id);

    // Si le bien devient Vacant ou Vendu, on archive le locataire actif
    if ((newStatus === 'Vacant' || newStatus === 'Vendu') && tenant) {
      await supabase.from('rentals').update({ is_active: false }).eq('id', tenant.id);
    }

    // Si on clique sur "Loué" et qu'il n'y a pas de locataire actif, on ouvre la modale
    if (newStatus === 'Loué' && !tenant) {
      openTenantModal();
    } else {
      fetchBienDetails(); // Rafraîchit l'affichage
    }
  }

  // Ouvrir la modale en chargeant les données du locataire actuel s'il existe
  function openTenantModal() {
    if (tenant) {
      setT1FirstName(tenant.tenant_first_name || '');
      setT1LastName(tenant.tenant_last_name || '');
      setT2FirstName(tenant.tenant2_first_name || '');
      setT2LastName(tenant.tenant2_last_name || '');
      setTEmail(tenant.tenant_email || '');
      setTPhone(tenant.tenant_phone || '');
      setTEntryDate(tenant.entry_date ? tenant.entry_date.split('T')[0] : '');
    } else {
      setT1FirstName(''); setT1LastName(''); setT2FirstName(''); setT2LastName('');
      setTEmail(''); setTPhone(''); setTEntryDate('');
    }
    setIsTenantModalOpen(true);
  }

  // États pour la modification du loyer
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [editRent, setEditRent] = useState('');
  const [editCharges, setEditCharges] = useState('');

  // États pour l'API INSEE (IRL)
  const [irlData, setIrlData] = useState<{ rate: number, quarter: string } | null>(null);
  const [isLoadingIrl, setIsLoadingIrl] = useState(false);


  // Fonction pour récupérer l'IRL via l'API du serveur
  async function fetchIRL() {
    setIsLoadingIrl(true);
    try {
      const response = await fetch('/api/irl');
      if (!response.ok) throw new Error("Erreur réseau");
      
      const data = await response.json();
      setIrlData({ rate: data.rate, quarter: data.quarter });
    } catch (error) {
      console.error("Impossible de charger l'IRL", error);
      setIrlData(null);
    } finally {
      setIsLoadingIrl(false);
    }
  }

  // Modifie ta fonction openRentModal pour qu'elle charge l'IRL à l'ouverture
  function openRentModal() {
    setEditRent(bien.base_rent_price?.toString() || '0');
    setEditCharges(bien.service_charges?.toString() || '0');
    setIsRentModalOpen(true);
    fetchIRL(); 
  }

  // Appliquer le pourcentage d'augmentation au montant saisi
  function applyIrlIncrease() {
    if (!irlData) return;
    const currentRent = parseFloat(editRent) || 0;
    const newRent = currentRent * (1 + (irlData.rate / 100));
    setEditRent(newRent.toFixed(2)); // Arrondi à 2 décimales
  }

  async function handleSaveRent(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('properties').update({
      base_rent_price: parseFloat(editRent) || 0,
      service_charges: parseFloat(editCharges) || 0
    }).eq('id', id);
    
    setIsRentModalOpen(false);
    fetchBienDetails();
  }

  // Enregistrer ou mettre à jour le locataire
  async function handleSaveTenant(e: React.FormEvent) {
    e.preventDefault();

    const tenantData = {
      property_id: id,
      tenant_first_name: t1FirstName,
      tenant_last_name: t1LastName,
      tenant2_first_name: t2FirstName || null,
      tenant2_last_name: t2LastName || null,
      tenant_email: tEmail,
      tenant_phone: tPhone,
      entry_date: tEntryDate,
      is_active: true
    };

    if (tenant) {
      // Mise à jour du locataire existant
      await supabase.from('rentals').update(tenantData).eq('id', tenant.id);
    } else {
      // Création d'un nouveau locataire + passage du bien en "Loué"
      await supabase.from('rentals').insert([tenantData]);
      await supabase.from('properties').update({ status: 'Loué' }).eq('id', id);
    }

    setIsTenantModalOpen(false);
    fetchBienDetails();
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des détails...</div>;
  if (!bien) return <div className="p-8 text-center text-red-500">Bien introuvable.</div>;

  
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
          <div className="text-right flex flex-col items-end">
            <p className="text-sm text-slate-500 mb-1">Loyer Mensuel</p>
            <div className="flex items-center gap-3">
              <button 
                onClick={openRentModal}
                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded font-medium transition-colors"
              >
                Modifier Loyer
              </button>
              <p className="text-2xl font-bold text-slate-900">
                {bien.base_rent_price} € <span className="text-sm font-normal text-slate-500">+ {bien.service_charges}€ ch.</span>
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Section Location actuelle */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold text-slate-800">Location actuelle</h2>
                
                {/* Boutons de statut */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => handleStatusChange('Vacant')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${bien.status === 'Vacant' || !bien.status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Vacant
                  </button>
                  <button 
                    onClick={() => handleStatusChange('Loué')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${bien.status === 'Loué' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Loué
                  </button>
                  <button 
                    onClick={() => handleStatusChange('Vendu')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${bien.status === 'Vendu' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Vendu
                  </button>
                </div>
              </div>

              {bien.status === 'Loué' && tenant ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Locataire(s)</p>
                      <p className="font-medium text-slate-900">{tenant.tenant_first_name} {tenant.tenant_last_name}</p>
                      {tenant.tenant2_first_name && (
                        <p className="font-medium text-slate-900">{tenant.tenant2_first_name} {tenant.tenant2_last_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Entrée le</p>
                      <p className="text-slate-800">{new Date(tenant.entry_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="col-span-2 mt-2 pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600">📧 {tenant.tenant_email || 'Non renseigné'}</p>
                      <p className="text-sm text-slate-600">📞 {tenant.tenant_phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={openTenantModal}
                    className="w-full text-sm bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                  >
                    Modifier le locataire
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-slate-500 text-sm mb-3">Le bien n'est actuellement pas loué.</p>
                  {bien.status === 'Loué' && (
                    <button 
                      onClick={openTenantModal}
                      className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      + Ajouter le locataire
                    </button>
                  )}
                </div>
              )}
            </div>

          {/* Colonnes Droite : Documents */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Section Bail */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Bail</h2>
                <Link 
  href={`/bien/${bien.id}/bail`}
  className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium inline-block"
>
  Générer le bail
</Link>
              </div>
              {bails.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">Aucun bail généré pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {bails.map(doc => (
                    <li key={doc.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50">
                      <div>
                        <span className="text-sm font-medium text-slate-700 block">{doc.file_name}</span>
                        {doc.created_at && (
                          <span className="text-xs text-slate-400">
                            Le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <Link 
                        href={`/bien/${id}/bail`} 
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Voir
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Section Quittances */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Historique des Quittances</h2>
                <Link 
                href={`/bien/${bien.id}/quittances`}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium inline-block"
              >
                Gérer quittances
              </Link>
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
      {/* Modale Locataire */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {tenant ? "Modifier le locataire" : "Nouveau locataire"}
            </h3>
            
            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom (Locataire 1)</label>
                  <input type="text" required value={t1FirstName} onChange={(e) => setT1FirstName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom (Locataire 1)</label>
                  <input type="text" required value={t1LastName} onChange={(e) => setT1LastName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom (Locataire 2)</label>
                  <input type="text" value={t2FirstName} onChange={(e) => setT2FirstName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom (Locataire 2)</label>
                  <input type="text" value={t2LastName} onChange={(e) => setT2LastName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input type="tel" value={tPhone} onChange={(e) => setTPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date d'entrée</label>
                <input type="date" required value={tEntryDate} onChange={(e) => setTEntryDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-slate-900" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setIsTenantModalOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modale Loyer */}
      {isRentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Modifier le loyer</h3>
            
            {/* Encart Indice de Référence des Loyers */}
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">
                  Indice IRL (INSEE)
                </span>
                {isLoadingIrl ? (
                  <span className="text-xs text-indigo-600 animate-pulse font-medium">Recherche...</span>
                ) : irlData ? (
                  <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                    {irlData.quarter} : +{irlData.rate}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Indisponible</span>
                )}
              </div>
              <p className="text-xs text-indigo-700/80 mb-3 leading-relaxed">
                L'augmentation annuelle est encadrée par l'Indice de Référence des Loyers.
              </p>
              <button 
                type="button" 
                onClick={applyIrlIncrease}
                disabled={!irlData || isLoadingIrl}
                className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 transition-colors shadow-sm"
              >
                Appliquer l'augmentation (+{irlData?.rate || 0}%)
              </button>
            </div>

            <form onSubmit={handleSaveRent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loyer de base (HC) en €</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  value={editRent} 
                  onChange={(e) => setEditRent(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Charges en €</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editCharges} 
                  onChange={(e) => setEditCharges(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsRentModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}