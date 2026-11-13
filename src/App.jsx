import { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  MessageSquare,
  Image,
  Target,
  Search,
  Loader2,
  Copy,
  Check,
  X,
} from "lucide-react";

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
const API_BASE = "http://localhost:8000";

const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) return [v];
  return [];
};

const asString = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
};

function App() {
  const [activeTab, setActiveTab] = useState("comptable");

  const tabs = [
    {
      id: "comptable",
      label: "Comptable",
      icon: FileText,
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "administratif",
      label: "Administratif",
      icon: MessageSquare,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: Image,
      color: "from-pink-500 to-rose-600",
    },
    {
      id: "commercial",
      label: "Commercial",
      icon: Target,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "seo",
      label: "SEO",
      icon: Search,
      color: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              IA Agent
            </h1>
            <p className="text-sm text-gray-600">Multi-Agents Consulting</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">API connectée</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          {activeTab === "comptable" && <ComptableTab />}
          {activeTab === "administratif" && <AdministratifTab />}
          {activeTab === "marketing" && <MarketingTab />}
          {activeTab === "commercial" && <CommercialTab />}
          {activeTab === "seo" && <SEOTab />}
        </div>
      </div>
    </div>
  );
}

function ComptableTab() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFournisseurModal, setShowFournisseurModal] = useState(false);
  const [fournisseurData, setFournisseurData] = useState({
    raison_sociale: "",
    siren: "",
    compte_charge: "",
    code_routage: "",
    bic: "",
    tva_intracom: "",
    iban: "",
    delai_paiement: "",
    paiement_direct: false,
    adresse: "",
    complement: "",
    code_postal: "",
    ville: "",
    pays: "France",
    tel_fixe: "",
    tel_portable: "",
    email: "",
  });
  const [fournisseurLoading, setFournisseurLoading] = useState(false);
  const [fournisseurSuccess, setFournisseurSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const response = await axios.post(
            `${API_BASE}/api/comptable/extract`,
            { image_base64: reader.result },
          );
          setResult(response.data);

          // Pré-remplir le modal avec les infos fournisseur extraites par l'IA
          if (response.data.fournisseur_infos) {
            const infos = response.data.fournisseur_infos;
            setFournisseurData((prev) => ({
              ...prev,
              raison_sociale:
                infos.raison_sociale || response.data.fournisseur || "",
              siren: infos.siren || "",
              tva_intracom: infos.tva_intracom || "",
              adresse: infos.adresse || "",
              code_postal: infos.code_postal || "",
              ville: infos.ville || "",
              pays: infos.pays || "France",
              email: infos.email || "",
              tel_fixe: infos.tel_fixe || "",
            }));
          }
        } catch (err) {
          console.error(err);
          setError("Erreur lors de l'extraction");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(image);
    } catch (error) {
      console.error(error);
      setError("Erreur de lecture du fichier");
      setLoading(false);
    }
  };

  const handleFournisseurSubmit = async (e) => {
    e.preventDefault();
    if (!fournisseurData.raison_sociale) return;
    setFournisseurLoading(true);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "fournisseur",
          ...fournisseurData,
        }),
      });
      setFournisseurSuccess(true);
      setFournisseurData({
        raison_sociale: "",
        siren: "",
        compte_charge: "",
        code_routage: "",
        bic: "",
        tva_intracom: "",
        iban: "",
        delai_paiement: "",
        paiement_direct: false,
        adresse: "",
        complement: "",
        code_postal: "",
        ville: "",
        pays: "France",
        tel_fixe: "",
        tel_portable: "",
        email: "",
      });
      setTimeout(() => {
        setFournisseurSuccess(false);
        setShowFournisseurModal(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
    setFournisseurLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Agent Comptable</h2>
      <p className="text-gray-600 mb-6">
        Extraction automatique de factures avec envoi vers Google Sheets
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition">
          {preview ? (
            <div>
              <img
                src={preview}
                alt="Aperçu"
                className="max-h-64 mx-auto rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setImage(null);
                }}
                className="mt-2 text-sm text-red-500"
              >
                Supprimer
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <FileText className="mx-auto mb-2 text-gray-400" size={48} />
              <p className="text-gray-600">
                Cliquez pour sélectionner une facture
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />
            </label>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="submit"
            disabled={loading || !image}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Extraction...
              </>
            ) : (
              "Extraire la facture"
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowFournisseurModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition"
          >
            <span>➕</span> Créer le fournisseur
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <h3 className="font-bold text-lg mb-4 text-emerald-900">
            Facture extraite - Format Evolbee
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Info label="Titulaire" value="GOURDON Cyril" />
            <Info label="Fournisseur" value={result.fournisseur} />
            <Info label="Date facture" value={result.date} />
            <Info label="Numéro facture" value={result.numero_facture || "-"} />
            <Info
              label="Montant HT"
              value={`${result.montant_ht} €`}
              highlight
            />
            <Info label="TVA" value={`${result.montant_tva} €`} />
            <Info
              label="% TVA"
              value={
                result.montant_ht > 0
                  ? `${((result.montant_tva / result.montant_ht) * 100).toFixed(2)}%`
                  : "-"
              }
            />
            <Info
              label="Total TTC"
              value={`${result.montant_ttc} €`}
              highlight
            />
          </div>
          {result.lignes?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-emerald-900">Lignes :</h4>
              <div className="space-y-2">
                {result.lignes.map((ligne, i) => (
                  <div
                    key={i}
                    className="bg-white p-3 rounded-lg flex justify-between border border-emerald-100"
                  >
                    <div>
                      <span className="font-medium">{ligne.designation}</span>
                      {ligne.libelle && ligne.libelle !== ligne.designation && (
                        <p className="text-xs text-gray-500 mt-1">
                          {ligne.libelle}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {ligne.prixFinal} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.fournisseur_infos && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-900">
                ℹ️ Infos fournisseur extraites par l'IA
              </h4>
              <p className="text-sm text-blue-800">
                Cliquez sur "Créer le fournisseur" pour les enregistrer dans
                Google Sheets.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL FOURNISSEUR */}
      {showFournisseurModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Créer un fournisseur</h3>
              <button
                onClick={() => setShowFournisseurModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleFournisseurSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Raison Sociale *"
                  value={fournisseurData.raison_sociale}
                  onChange={(v) =>
                    setFournisseurData({
                      ...fournisseurData,
                      raison_sociale: v,
                    })
                  }
                  required
                />
                <InputField
                  label="SIREN"
                  value={fournisseurData.siren}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, siren: v })
                  }
                />
                <InputField
                  label="Compte de charge *"
                  value={fournisseurData.compte_charge}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, compte_charge: v })
                  }
                  required
                />
                <InputField
                  label="Code de routage"
                  value={fournisseurData.code_routage}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, code_routage: v })
                  }
                />
                <InputField
                  label="BIC"
                  value={fournisseurData.bic}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, bic: v })
                  }
                />
                <InputField
                  label="N° TVA Intracomm. *"
                  value={fournisseurData.tva_intracom}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, tva_intracom: v })
                  }
                  required
                />
                <InputField
                  label="IBAN"
                  value={fournisseurData.iban}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, iban: v })
                  }
                />
                <InputField
                  label="Délai de paiement"
                  value={fournisseurData.delai_paiement}
                  onChange={(v) =>
                    setFournisseurData({
                      ...fournisseurData,
                      delai_paiement: v,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={fournisseurData.paiement_direct}
                  onChange={(e) =>
                    setFournisseurData({
                      ...fournisseurData,
                      paiement_direct: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Paiement direct</label>
              </div>

              <h4 className="font-bold text-gray-700 pt-2 border-t">Adresse</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Adresse"
                  value={fournisseurData.adresse}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, adresse: v })
                  }
                />
                <InputField
                  label="Complément"
                  value={fournisseurData.complement}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, complement: v })
                  }
                />
                <InputField
                  label="Code postal"
                  value={fournisseurData.code_postal}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, code_postal: v })
                  }
                />
                <InputField
                  label="Ville"
                  value={fournisseurData.ville}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, ville: v })
                  }
                />
                <InputField
                  label="Pays"
                  value={fournisseurData.pays}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, pays: v })
                  }
                />
              </div>

              <h4 className="font-bold text-gray-700 pt-2 border-t">
                Coordonnées
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Tel Fixe"
                  value={fournisseurData.tel_fixe}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, tel_fixe: v })
                  }
                />
                <InputField
                  label="Tel Portable"
                  value={fournisseurData.tel_portable}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, tel_portable: v })
                  }
                />
                <InputField
                  label="Email"
                  value={fournisseurData.email}
                  onChange={(v) =>
                    setFournisseurData({ ...fournisseurData, email: v })
                  }
                  type="email"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFournisseurModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={
                    fournisseurLoading || !fournisseurData.raison_sociale
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {fournisseurLoading
                    ? "Enregistrement..."
                    : fournisseurSuccess
                      ? "✓ Enregistré !"
                      : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, required, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

function AdministratifTab() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/api/administratif/response`,
        { content: message, type },
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Agent Administratif</h2>
      <p className="text-gray-600 mb-6">
        Génération de réponses personnalisées avec votre base de connaissances
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {["email", "sms", "message"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 rounded-lg font-medium capitalize ${type === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Collez le message reçu..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading || !message}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Génération...
            </>
          ) : (
            "Générer des réponses"
          )}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {asArray(result?.suggestions).length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-bold text-lg">Suggestions de réponse</h3>
          {asArray(result.suggestions).map((suggestion, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 relative"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-blue-600 uppercase">
                  Option {idx + 1}
                </span>
                <button
                  onClick={() => copyText(asString(suggestion), idx)}
                  className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm"
                >
                  {copied === idx ? (
                    <>
                      <Check size={14} /> Copié
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copier
                    </>
                  )}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-gray-800 text-sm">
                {asString(suggestion)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketingTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docType, setDocType] = useState("flyer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);
      const response = await axios.post(
        `${API_BASE}/api/marketing/analyze-flyer`,
        formData,
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Agent Marketing</h2>
      <p className="text-gray-600 mb-6">
        Analyse de flyers, cartes de visite et brochures
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["flyer", "Flyer"],
            ["carte_visite", "Carte de visite"],
            ["brochure", "Brochure"],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setDocType(v)}
              className={`py-2 rounded-lg font-medium ${docType === v ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          {preview ? (
            <img
              src={preview}
              alt="Aperçu"
              className="max-h-64 mx-auto rounded-lg"
            />
          ) : (
            <label className="cursor-pointer">
              <Image className="mx-auto mb-2 text-gray-400" size={48} />
              <p className="text-gray-600">Sélectionnez une image</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Analyse...
            </>
          ) : (
            "Analyser le document"
          )}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200 relative">
            <button
              onClick={() => setResult(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold mb-2 text-pink-900">Feedback</h3>
            <p className="text-gray-800 whitespace-pre-wrap">
              {asString(result.feedback) || "Aucun feedback"}
            </p>
          </div>
          {asArray(result.improvements).length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold mb-2">Améliorations suggérées</h3>
              <ul className="space-y-1">
                {asArray(result.improvements).map((imp, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-pink-500">•</span>
                    {asString(imp)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommercialTab() {
  const [secteur, setSecteur] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/api/commercial/prospect-strategy?secteur=${encodeURIComponent(secteur)}&localisation=${encodeURIComponent(localisation)}`,
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Agent Commercial</h2>
      <p className="text-gray-600 mb-6">
        Stratégie de prospection ciblée pour PME/TPE locales
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={secteur}
          onChange={(e) => setSecteur(e.target.value)}
          placeholder="Secteur (ex: Boulangerie)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
        />
        <input
          type="text"
          value={localisation}
          onChange={(e) => setLocalisation(e.target.value)}
          placeholder="Localisation (ex: Soissons)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={loading || !secteur || !localisation}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Génération...
            </>
          ) : (
            "Générer la stratégie"
          )}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="mt-6 space-y-3 relative">
          <button
            onClick={() => setResult(null)}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
          <Card title="Cible" value={asString(result.cible)} color="amber" />
          <Card
            title="Point de douleur"
            value={asString(result.point_de_douleur)}
            color="red"
          />
          <Card
            title="Argumentaire IA"
            value={asString(result.argumentaire_ia)}
            color="blue"
          />
          <Card
            title="Action recommandée"
            value={asString(result.action)}
            color="green"
          />
        </div>
      )}
    </div>
  );
}

function SEOTab() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/api/seo/analyze?url=${encodeURIComponent(url)}&focus_keyword=${encodeURIComponent(keyword)}`,
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'analyse SEO");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Agent SEO</h2>
      <p className="text-gray-600 mb-6">
        Analyse SEO complète de n'importe quelle page web
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Mot-clé cible (optionnel)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Analyse...
            </>
          ) : (
            "Analyser le SEO"
          )}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4 relative">
          <button
            onClick={() => setResult(null)}
            className="absolute -top-8 right-0 text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
          <div
            className={`bg-gradient-to-r ${getScoreColor(Number(result.seo_score) || 0)} p-6 rounded-xl text-white`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <p className="text-sm opacity-90">Score SEO</p>
                <p className="text-5xl font-bold">
                  {asString(result.seo_score)}
                  <span className="text-2xl">/100</span>
                </p>
              </div>
              <div className="text-right text-sm space-y-1 min-w-0 flex-1">
                <p className="truncate" title={asString(result.title_found)}>
                  <strong>Title :</strong>{" "}
                  {asString(result.title_found) || "Manquant"}
                </p>
                <p>
                  <strong>Mots :</strong> {asString(result.word_count)}
                </p>
                <p>
                  <strong>H1 :</strong> {asString(result.h1_count)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label="Images sans alt"
              value={asString(result.images_without_alt)}
              color={Number(result.images_without_alt) === 0 ? "green" : "red"}
            />
            <Stat
              label="Liens internes"
              value={asString(result.internal_links)}
              color="blue"
            />
            <Stat
              label="Liens externes"
              value={asString(result.external_links)}
              color="purple"
            />
            <Stat
              label="Meta desc."
              value={result.meta_description ? "OK" : "Manquante"}
              color={result.meta_description ? "green" : "red"}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h3 className="font-bold text-green-900 mb-2">✓ Points forts</h3>
              <ul className="space-y-1">
                {asArray(result.strengths).map((s, i) => (
                  <li key={i} className="text-sm text-green-800">
                    • {asString(s)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <h3 className="font-bold text-red-900 mb-2">✗ Points faibles</h3>
              <ul className="space-y-1">
                {asArray(result.weaknesses).map((w, i) => (
                  <li key={i} className="text-sm text-red-800">
                    • {asString(w)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">💡 Recommandations</h3>
            <ul className="space-y-1">
              {asArray(result.recommendations).map((r, i) => (
                <li key={i} className="text-sm text-blue-800">
                  → {asString(r)}
                </li>
              ))}
            </ul>
          </div>
          {asString(result.html_suggestion) && (
            <div className="bg-gray-900 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">Snippet HTML/Tailwind</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      asString(result.html_suggestion),
                    );
                    alert("Code copié !");
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                >
                  📋 Copier
                </button>
              </div>
              <div className="bg-black rounded-lg p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs text-green-400 whitespace-pre-wrap break-all font-mono">
                  {asString(result.html_suggestion)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, highlight }) {
  return (
    <div
      className={`p-3 rounded-lg ${highlight ? "bg-white border border-emerald-200" : "bg-white/50"}`}
    >
      <p className="text-xs text-gray-600">{label}</p>
      <p
        className={`font-semibold ${highlight ? "text-emerald-700 text-lg" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Card({ title, value, color }) {
  const colorClasses = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    red: "bg-red-50 border-red-200 text-red-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
  };
  const classes =
    colorClasses[color] || "bg-gray-50 border-gray-200 text-gray-900";
  return (
    <div className={`p-4 rounded-xl border ${classes}`}>
      <h4 className="font-bold mb-1 text-sm uppercase">{title}</h4>
      <p className="text-gray-800 whitespace-pre-wrap">{value || "-"}</p>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colorClasses = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };
  const classes = colorClasses[color] || "bg-gray-100 text-gray-800";
  return (
    <div className={`${classes} p-3 rounded-lg text-center`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="font-bold text-lg">{value ?? "-"}</p>
    </div>
  );
}

export default App;
