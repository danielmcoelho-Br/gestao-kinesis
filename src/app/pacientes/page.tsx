"use client";

import { useEffect, useState, useMemo } from "react";
import { usePeriod } from "@/context/PeriodContext";
import { 
  Users, 
  Map as MapIcon, 
  UserCircle, 
  Briefcase, 
  Navigation,
  Search,
  Filter,
  Download,
  Activity
} from "lucide-react";
import { MetricCard } from "@/components/DashboardComponents";
import { 
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { ReportHeader } from "@/components/ReportHeader";
import { 
  GoogleMap, 
  useJsApiLoader, 
  HeatmapLayer,
  MarkerF 
} from '@react-google-maps/api';
import { PatientProfileResponse, Patient } from "@/types";
import { StatsService } from "@/services/statsService";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ["visualization"];

export default function PacientesPage() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [data, setData] = useState<PatientProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<'stats' | 'list' | 'map'>('stats');

  const fetchStats = async () => {
    if (!initialized) return;
    setLoading(true);
    try {
      const url = `/api/patients/stats?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Erro ao buscar estatísticas de pacientes", e);
    } finally {
      setLoading(false);
    }
  };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  const runGeocoding = async () => {
    setGeocoding(true);
    try {
      const res = await fetch('/api/patients/geocode', { method: 'POST' });
      const result = await res.json();
      alert(result.message || result.error);
      fetchStats();
    } catch (e) {
      alert("Erro ao processar geocodificação");
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (initialized) {
      fetchStats();
    }
  }, [startMonth, startYear, endMonth, endYear, initialized]);

  const filteredPatients = useMemo(() => {
    if (!data?.patients) return [];
    return data.patients.filter((p: Patient) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.provenance?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const statsData = useMemo(() => {
    if (!data) return null;
    const { stats } = data;
    const ageData = StatsService.formatAgeChartData(stats.stratifiedAgeData, stats.withProfile);
    
    return { ageData, stats };
  }, [data]);

  const heatmapPoints = useMemo(() => {
    if (isLoaded && data?.stats?.heatmapData) {
      return data.stats.heatmapData.map((p) => new google.maps.LatLng(p.lat, p.lng));
    }
    return [];
  }, [isLoaded, data]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
      <div className="loader"></div>
      <p style={{ color: 'var(--text-secondary)' }}>Mapeando perfil da clínica...</p>
    </div>
  );

  if (!data || !statsData) return <div>Nenhum dado encontrado. Faça upload do perfil dos pacientes.</div>;

  const { stats, patients, missingProfiles } = data;
  const { ageData } = statsData;
  const professionData = stats.allProfessions;
  const provenanceData = stats.allProvenance;

  const kinesisLocation = { lat: -21.1969, lng: -47.8105 };

  return (
    <div className="patient-profile-container" style={{ paddingBottom: '60px' }}>
      <ReportHeader title="Perfil dos Pacientes" />
      <header className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--primary)', color: 'white', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
            {months[startMonth]} de {startYear} { (startMonth !== endMonth || startYear !== endYear) && `até ${months[endMonth]} de ${endYear}` }
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', margin: 0, color: 'var(--text-primary)' }}>
            Estatísticas de <span style={{ color: 'var(--primary)' }}>Pacientes</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '4px' }}>
            Dados demográficos referentes a {months[startMonth]}/{startYear} até {months[endMonth]}/{endYear}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => window.print()} 
            className="btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', borderRadius: '12px', padding: '12px 20px' }}
          >
            <Download size={20} /> Exportar Relatório
          </button>

          <div className="tab-buttons-container" style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(0,0,0,0.03)', borderRadius: '14px' }}>
            <button 
              onClick={() => setActiveView('stats')} 
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeView === 'stats' ? 'white' : 'transparent', color: activeView === 'stats' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', boxShadow: activeView === 'stats' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
            >
              Análise
            </button>
            <button 
              onClick={() => setActiveView('list')} 
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeView === 'list' ? 'white' : 'transparent', color: activeView === 'list' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', boxShadow: activeView === 'list' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
            >
              Lista Nominal
            </button>
            <button 
              onClick={() => setActiveView('map')} 
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeView === 'map' ? 'white' : 'transparent', color: activeView === 'map' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', boxShadow: activeView === 'map' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
            >
              Mapa Geográfico
            </button>
          </div>
        </div>
      </header>

      <div className="report-body">
        {activeView === 'stats' && (
          <div className="fade-in">
            <section className="metrics-grid no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {[
                { title: "Pacientes Atendidos", value: stats.totalAttended, icon: <Users />, color: "var(--primary)" },
                { title: "Perfis Localizados", value: stats.withProfile, icon: <UserCircle />, color: "#10b981" },
                { title: "Aguardando Cadastro", value: stats.missingProfile, icon: <Filter />, color: "#f59e0b" }
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: `1px solid #eee`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: `${m.color}15`, color: m.color }}>{m.icon}</div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.title}</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}>{m.value}</div>
                  <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03, transform: 'scale(3)' }}>{m.icon}</div>
                </div>
              ))}
            </section>

            <div className="card" style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="var(--primary)" /> Perfil por Gênero e Idade
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Gênero</th>
                      <th style={{ padding: '12px' }}>Clientes</th>
                      <th style={{ padding: '12px' }}>Média de idade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Feminino', count: stats.summary.female.count, avg: stats.summary.female.avgAge, color: '#ec4899' },
                      { label: 'Masculino', count: stats.summary.male.count, avg: stats.summary.male.avgAge, color: '#6366f1' }
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', minWidth: '40px' }}>
                              {stats.withProfile > 0 ? ((row.count / stats.withProfile) * 100).toFixed(1) : 0}%
                            </span>
                            <div style={{ flex: 1, height: '24px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden', minWidth: '150px' }}>
                              <div style={{ height: '100%', width: `${stats.withProfile > 0 ? (row.count / stats.withProfile) * 100 : 0}%`, background: row.color }}>
                                <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700', paddingLeft: '8px', lineHeight: '24px' }}>{row.label}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '1.1rem' }}>{row.count}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>Média de idade <strong>{row.avg}</strong></td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(0,0,0,0.02)', fontWeight: '700' }}>
                      <td style={{ padding: '16px 12px' }}>TOTAL</td>
                      <td style={{ padding: '16px 12px', fontSize: '1.2rem' }}>{stats.withProfile}</td>
                      <td style={{ padding: '16px 12px' }}>Média de idade <strong>{stats.summary.totalAvgAge}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Homens</th>
                      <th style={{ textAlign: 'center' }}></th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Mulheres</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.stratifiedAgeData.map((row, i) => {
                      const totalInRange = row.men + row.women;
                      const pct = stats.withProfile > 0 ? ((totalInRange / stats.withProfile) * 100).toFixed(1) : 0;
                      const maxCount = Math.max(...stats.stratifiedAgeData.map((d) => Math.max(d.men, d.women)));
                      
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                              <span style={{ fontWeight: '600' }}>{row.men}</span>
                              <div style={{ width: '60px', height: '14px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'flex-end', borderRadius: '2px' }}>
                                <div style={{ height: '100%', width: `${maxCount > 0 ? (row.men / maxCount) * 100 : 0}%`, background: '#6366f1' }}></div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', minWidth: '100px' }}>
                            {row.label}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px' }}>
                              <div style={{ width: '60px', height: '14px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '2px' }}>
                                <div style={{ height: '100%', width: `${maxCount > 0 ? (row.women / maxCount) * 100 : 0}%`, background: '#ec4899' }}></div>
                              </div>
                              <span style={{ fontWeight: '600' }}>{row.women}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>{totalInRange}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              <div className="card chart-card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} color="#ec4899" /> Distribuição por Faixa Etária (Décadas)</h3>
                <div style={{ height: '400px' }} className="chart-container-inner is-expanded">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600 }} />
                      <Tooltip 
                        isAnimationActive={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <p style={{ margin: 0, fontWeight: '800' }}>{payload[0].payload.name}</p>
                                <p style={{ margin: 0, color: '#ec4899' }}>{payload[0].value} pacientes ({payload[0].payload.pct}%)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={25} isAnimationActive={false}>
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          formatter={(val: number, entry: any) => {
                            if (!entry || !entry.payload) return val;
                            return `${val} (${entry.payload.pct}%)`;
                          }}
                          style={{ fontSize: '0.8rem', fontWeight: '700', fill: 'var(--text-primary)' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div className="card">
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={20} color="#10b981" /> Profissões dos Pacientes Atendidos</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {professionData.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                          <span style={{ fontWeight: '600' }}>{item[0]}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{((item[1] / stats.withProfile) * 100).toFixed(1)}%</span>
                            <span style={{ fontWeight: '800', color: 'var(--primary)', minWidth: '30px', textAlign: 'right' }}>{item[1]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Navigation size={20} color="#f59e0b" /> Procedência / Bairros</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {provenanceData.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                          <span style={{ fontWeight: '600' }}>{item[0]}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{((item[1] / stats.withProfile) * 100).toFixed(1)}%</span>
                            <span style={{ fontWeight: '800', color: '#f59e0b', minWidth: '30px', textAlign: 'right' }}>{item[1]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'list' && (
          <div className="fade-in card">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="text" 
                  placeholder="Filtrar pacientes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome do Paciente</th>
                    <th>Gênero</th>
                    <th>Idade</th>
                    <th>Profissão</th>
                    <th>Origem</th>
                    <th>Bairro/Procedência</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p: Patient, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '700' }}>{p.name}</td>
                      <td>{p.gender || 'N/I'}</td>
                      <td>{p.age || 'N/I'}</td>
                      <td>{p.profession || 'N/I'}</td>
                      <td>{p.origin || 'N/I'}</td>
                      <td>{p.provenance || 'N/I'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'map' && (
          <div className="fade-in card" style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Mapa de Calor Geográfico</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Concentração de pacientes atendidos em {months[startMonth]}/{startYear} até {months[endMonth]}/{endYear}
                </p>
              </div>
              <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn" 
                  onClick={runGeocoding} 
                  disabled={geocoding}
                  style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {geocoding ? "Processando..." : "Geocodificar Endereços"}
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }} className="map-container-print">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={kinesisLocation}
                  zoom={14}
                  options={{
                    styles: [
                      { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                      { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#c9c9c9" }] }
                    ]
                  }}
                >
                  {heatmapPoints.length > 0 && (
                    <HeatmapLayer
                      data={heatmapPoints}
                      options={{ radius: 20, opacity: 0.6 }}
                    />
                  )}
                  <MarkerF 
                    position={kinesisLocation} 
                    label={{
                      text: "Kinesis",
                      color: "black",
                      fontWeight: "bold",
                      fontSize: "14px"
                    }}
                    title="Clínica Kinesis"
                  />
                </GoogleMap>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <MapIcon size={64} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '20px' }} />
                  <h4 style={{ color: 'var(--text-secondary)' }}>Aguardando Configuração</h4>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
