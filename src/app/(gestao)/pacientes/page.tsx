"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePeriod } from "@/gestao/context/PeriodContext";
import { 
  Users, 
  Map as MapIcon, 
  UserCircle, 
  Briefcase, 
  Navigation,
  Search,
  Filter,
  Download,
  Activity,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  X,
  XCircle,
  TrendingUp,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { MetricCard } from "@/gestao/components/DashboardComponents";
import { 
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { ReportHeader } from "@/gestao/components/ReportHeader";
import { 
  GoogleMap, 
  useJsApiLoader, 
  HeatmapLayer,
  MarkerF 
} from '@react-google-maps/api';
import { PatientProfileResponse, Patient } from "@/gestao/types";
import { ClientStatsService } from "@/gestao/services/clientStatsService";
import { getDischargedDiagnoses, getProfessionalDiagnosticsFrequency, getProfessionalCasesFrequency, getAverageSessionsPerDiagnosis } from "@/app/(lab)/dashboard/actions";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const libraries: ("visualization" | "places" | "drawing" | "geometry")[] = ["visualization"];

const kinesisLocation = { lat: -21.1937048, lng: -47.8179272 };

export default function PacientesPage() {
  const { startMonth, startYear, endMonth, endYear, initialized } = usePeriod();
  const [data, setData] = useState<PatientProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingText, setGeocodingText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<'stats' | 'list' | 'map' | 'inactive'>('stats');
  const [inactiveData, setInactiveData] = useState<{ inactivePatients: any[], feedbacks: any[] } | null>(null);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  // Referências e estado para o mapa do Leaflet
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  // Force Leaflet for client-side rendering to avoid React 19 compatibility crashes with react-google-maps components
  const hasGoogleMapsApiKey = false;

  const heatmapPoints = useMemo(() => {
    const isMapApiReady = hasGoogleMapsApiKey && isLoaded && typeof window !== 'undefined' && !!(window as any).google?.maps;
    if (isMapApiReady && data?.stats?.heatmapData && (window as any).google?.maps?.LatLng) {
      try {
        return data.stats.heatmapData.map((p) => new google.maps.LatLng(p.lat, p.lng));
      } catch (e) {
        console.error("Erro ao instanciar google.maps.LatLng:", e);
        return [];
      }
    }
    return [];
  }, [isLoaded, data]);
  
  // Novos estados para filtro de Fisioterapeuta e Alta
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [showDischarged, setShowDischarged] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  // Estados para Altas, Frequências de Diagnósticos, Casos e Média de Atendimentos
  const [dischargedDiagnoses, setDischargedDiagnoses] = useState<any[]>([]);
  const [loadingDischarged, setLoadingDischarged] = useState<boolean>(true);
  const [dropoutDiagnoses, setDropoutDiagnoses] = useState<any[]>([]);
  const [loadingDropouts, setLoadingDropouts] = useState<boolean>(true);
  const [diagnosticsFrequency, setDiagnosticsFrequency] = useState<any[]>([]);
  const [loadingFrequency, setLoadingFrequency] = useState<boolean>(true);
  const [casesFrequency, setCasesFrequency] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState<boolean>(true);
  const [averageSessions, setAverageSessions] = useState<any[]>([]);
  const [loadingAvgSessions, setLoadingAvgSessions] = useState<boolean>(true);
  const [avgPeriodMode, setAvgPeriodMode] = useState<'all' | 'month'>('all');

  // Estado para controle de expansão de sanfona por segmento
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({});
  const toggleSegment = (key: string) => {
    setExpandedSegments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Auxiliar para agrupar Frequência por segmento e calcular porcentagem do total
  const groupFrequencyBySegment = (items: any[]) => {
    const groups: Record<string, { total: number; items: any[] }> = {};
    let totalAll = 0;

    for (const item of items) {
      const segName = item.segment || "Outros";
      if (!groups[segName]) {
        groups[segName] = { total: 0, items: [] };
      }
      groups[segName].items.push(item);
      groups[segName].total += item.count;
      totalAll += item.count;
    }

    return Object.entries(groups).map(([segmentName, data]) => {
      const percentage = totalAll > 0 ? (data.total / totalAll) * 100 : 0;
      return {
        segmentName,
        total: data.total,
        percentage: Number(percentage.toFixed(1)),
        items: data.items.map(it => ({
          ...it,
          segmentPercentage: data.total > 0 ? Number(((it.count / data.total) * 100).toFixed(1)) : 0,
          totalPercentage: totalAll > 0 ? Number(((it.count / totalAll) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.count - a.count)
      };
    }).sort((a, b) => b.total - a.total);
  };

  // Auxiliar para agrupar Média de Sessões por segmento (média ponderada) e calcular porcentagem do total de altas
  const groupAverageSessionsBySegment = (items: any[]) => {
    const groups: Record<string, { totalCases: number; totalWeightedSessions: number; items: any[] }> = {};
    let totalCasesAll = 0;

    for (const item of items) {
      const segName = item.segment || "Outros";
      if (!groups[segName]) {
        groups[segName] = { totalCases: 0, totalWeightedSessions: 0, items: [] };
      }
      groups[segName].items.push(item);
      groups[segName].totalCases += item.casesCount;
      groups[segName].totalWeightedSessions += item.averageSessions * item.casesCount;
      totalCasesAll += item.casesCount;
    }

    return Object.entries(groups).map(([segmentName, data]) => {
      const percentage = totalCasesAll > 0 ? (data.totalCases / totalCasesAll) * 100 : 0;
      const weightedAvg = data.totalCases > 0 ? (data.totalWeightedSessions / data.totalCases) : 0;
      return {
        segmentName,
        totalCases: data.totalCases,
        averageSessions: Number(weightedAvg.toFixed(1)),
        percentage: Number(percentage.toFixed(1)),
        items: data.items.map(it => ({
          ...it,
          segmentCasesPercentage: data.totalCases > 0 ? Number(((it.casesCount / data.totalCases) * 100).toFixed(1)) : 0,
          totalCasesPercentage: totalCasesAll > 0 ? Number(((it.casesCount / totalCasesAll) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.casesCount - a.casesCount)
      };
    }).sort((a, b) => b.totalCases - a.totalCases);
  };

  useEffect(() => {
    const isMapApiReady = hasGoogleMapsApiKey && isLoaded && typeof window !== 'undefined' && !!(window as any).google?.maps;
    if (activeView !== 'map' || isMapApiReady) {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const loadLeaflet = async () => {
      if ((window as any).L) {
        if (isMounted) setLeafletLoaded(true);
        return;
      }

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => {
          if (isMounted) setLeafletLoaded(true);
        };
        script.onerror = () => {
          console.error("Erro ao carregar script do Leaflet.");
        };
        document.body.appendChild(script);
      } else {
        const checkL = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkL);
            if (isMounted) setLeafletLoaded(true);
          }
        }, 100);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, [activeView, isLoaded]);

  useEffect(() => {
    const isMapApiReady = hasGoogleMapsApiKey && isLoaded && typeof window !== 'undefined' && !!(window as any).google?.maps;
    if (!leafletLoaded || activeView !== 'map' || isMapApiReady || !leafletContainerRef.current) {
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    const container = leafletContainerRef.current;

    if (leafletMapInstanceRef.current) {
      try {
        leafletMapInstanceRef.current.remove();
      } catch (e) {
        console.error("Error removing map:", e);
      }
      leafletMapInstanceRef.current = null;
    }

    // Force clear internal leaflet ID to allow clean re-initialization
    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    let map: any;
    try {
      map = L.map(container).setView(
        [kinesisLocation.lat, kinesisLocation.lng],
        14
      );
      leafletMapInstanceRef.current = map;
    } catch (err) {
      console.error("Failed to initialize Leaflet map:", err);
      return;
    }

    try {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([kinesisLocation.lat, kinesisLocation.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup('<strong>Clínica Kinesis</strong><br/>Centro de Atendimento')
        .openPopup();

      if (data?.stats?.heatmapData && Array.isArray(data.stats.heatmapData)) {
        data.stats.heatmapData.forEach((point: { lat: number, lng: number }) => {
          if (point.lat && point.lng) {
            L.circleMarker([point.lat, point.lng], {
              color: '#ffffff', // White border for contrast
              fillColor: '#ef4444', // Sleek modern red
              fillOpacity: 0.6,
              radius: 6, // Fixed 6px radius regardless of zoom
              weight: 1,
              stroke: true
            }).addTo(map);
          }
        });
      }
    } catch (renderErr) {
      console.error("Error rendering map layers:", renderErr);
    }

    return () => {
      if (leafletMapInstanceRef.current) {
        try {
          leafletMapInstanceRef.current.remove();
        } catch (e) {
          console.error("Error cleaning up map instance:", e);
        }
        leafletMapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, activeView, isLoaded, data]);

  const fetchInactivePatients = async () => {
    setLoadingInactive(true);
    try {
      const url = `/api/patients/inactive?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setInactiveData(json);
      }
    } catch (e) {
      console.error("Erro ao buscar inativos", e);
    } finally {
      setLoadingInactive(false);
    }
  };

  const handleTriggerReengagement = async (patientId: string) => {
    setTriggeringId(patientId);
    try {
      const res = await fetch('/api/patients/inactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      const result = await res.json();
      if (result.success) {
        alert("Mensagem de reengajamento simulada enviada com sucesso!");
        fetchInactivePatients(); // Refresh list to update log timestamp
      } else {
        alert("Erro: " + result.error);
      }
    } catch (e) {
      alert("Erro ao disparar mensagem");
    } finally {
      setTriggeringId(null);
    }
  };

  useEffect(() => {
    if (activeView === 'inactive') {
      fetchInactivePatients();
    }
  }, [activeView, startMonth, startYear, endMonth, endYear]);

  // Carregar profissionais e dados do usuário logado
  useEffect(() => {
    fetch("/api/profissionais")
      .then(res => res.json())
      .then(data => setProfessionals(Array.isArray(data) ? data : []))
      .catch(() => setProfessionals([]));

    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.id) setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

  // Definir filtro padrão caso o usuário logado seja Fisioterapeuta
  useEffect(() => {
    if (user && professionals.length > 0) {
      const matched = professionals.find(p => p.name.toLowerCase() === user.name.toLowerCase());
      if (matched) {
        setSelectedProfessional(matched.id);
      }
    }
  }, [user, professionals]);

  const fetchMainAnalyticsData = async (profId: string) => {
    setLoadingDischarged(true);
    setLoadingDropouts(true);
    setLoadingFrequency(true);
    setLoadingCases(true);

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYear = now.getFullYear();

    try {
      const resultDischarged = await getDischargedDiagnoses(profId, currentMonth, currentYear, currentMonth, currentYear, "ALTA");
      if (resultDischarged.success) {
        setDischargedDiagnoses(resultDischarged.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar altas em pacientes:", err);
    } finally {
      setLoadingDischarged(false);
    }

    try {
      const resultDropouts = await getDischargedDiagnoses(profId, currentMonth, currentYear, currentMonth, currentYear, "DESISTENCIA");
      if (resultDropouts.success) {
        setDropoutDiagnoses(resultDropouts.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar desistências em pacientes:", err);
    } finally {
      setLoadingDropouts(false);
    }

    try {
      const resultFreq = await getProfessionalDiagnosticsFrequency(profId, currentMonth, currentYear, currentMonth, currentYear);
      if (resultFreq.success) {
        setDiagnosticsFrequency(resultFreq.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar frequências em pacientes:", err);
    } finally {
      setLoadingFrequency(false);
    }

    try {
      const resultCases = await getProfessionalCasesFrequency(profId, currentMonth, currentYear, currentMonth, currentYear);
      if (resultCases.success) {
        setCasesFrequency(resultCases.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar frequência de casos em pacientes:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchAverageSessions = async (profId: string) => {
    setLoadingAvgSessions(true);
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYear = now.getFullYear();

    try {
      const resultAvg = avgPeriodMode === 'all'
        ? await getAverageSessionsPerDiagnosis(profId)
        : await getAverageSessionsPerDiagnosis(profId, currentMonth, currentYear, currentMonth, currentYear);
      if (resultAvg.success) {
        setAverageSessions(resultAvg.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar média de sessões em pacientes:", err);
    } finally {
      setLoadingAvgSessions(false);
    }
  };

  useEffect(() => {
    fetchMainAnalyticsData(selectedProfessional);
  }, [selectedProfessional]);

  useEffect(() => {
    fetchAverageSessions(selectedProfessional);
  }, [selectedProfessional, avgPeriodMode]);

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

  const runGeocoding = async () => {
    setGeocoding(true);
    setGeocodingText("Iniciando...");
    try {
      let remaining = 1;
      let totalGeocoded = 0;
      let iterations = 0;
      const maxIterations = 100; // Safety guard limit

      while (remaining > 0 && iterations < maxIterations) {
        iterations++;
        const res = await fetch('/api/patients/geocode', { method: 'POST' });
        const result = await res.json();
        
        if (!res.ok) {
          throw new Error(result.error || "Erro na resposta do servidor");
        }

        if (result.error) {
          throw new Error(result.error);
        }

        const geocodedInThisBatch = (result.successCount || 0) + (result.placeholderCount || 0);
        totalGeocoded += geocodedInThisBatch;
        remaining = result.remaining || 0;

        // Update button text progress
        setGeocodingText(`Processados: ${totalGeocoded} (${remaining} restam)`);

        // If Nominatim is active, stop after the first batch to prevent IP bans
        if (!result.hasGoogleMapsKey) {
          alert(`${geocodedInThisBatch} endereços processados. Para evitar bloqueio de limites na rede local (Nominatim), o processo automático foi pausado. Clique novamente para processar o próximo lote.`);
          break;
        }

        if (remaining === 0 || geocodedInThisBatch === 0) {
          alert(`Mapeamento concluído! ${totalGeocoded} endereços processados.`);
          break;
        }

        // 300ms sleep between Google batches
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      fetchStats();
    } catch (e: any) {
      alert(e.message || "Erro ao processar geocodificação");
    } finally {
      setGeocoding(false);
      setGeocodingText("");
    }
  };

  useEffect(() => {
    if (initialized) {
      fetchStats();
    }
  }, [startMonth, startYear, endMonth, endYear, initialized]);

  const filteredPatients = useMemo(() => {
    if (!data?.patients) return [];
    return data.patients.filter((p: any) => {
      // 1. Filtro por Fisioterapeuta
      if (selectedProfessional !== "all") {
        const hasSessionWithProf = p.professionals?.some((prof: any) => prof.id === selectedProfessional);
        if (!hasSessionWithProf) return false;
      }

      // 2. Filtro por Alta (Em Atendimento)
      const isDischarged = p.diagnoses && p.diagnoses.length > 0 && p.diagnoses.every((d: any) => d.status === "ALTA");
      if (isDischarged && !showDischarged) return false;

      // 3. Filtro por busca de texto
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.profession && p.profession.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.provenance && p.provenance.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [data, searchTerm, selectedProfessional, showDischarged]);

  // Estatísticas de distância dos pacientes em relação à clínica
  const distanceStats = useMemo(() => {
    if (!data?.stats?.heatmapData || !Array.isArray(data.stats.heatmapData)) {
      return { average: null, stdDev: null, mode: null, count: 0, ranges: [] };
    }
    
    const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const validPoints = data.stats.heatmapData
      .filter((p: any) => p.lat && p.lng && (p.lat !== 0 || p.lng !== 0))
      .map((p: any) => {
        const dist = getDistanceInKm(kinesisLocation.lat, kinesisLocation.lng, p.lat, p.lng);
        return {
          distance: dist,
          sessions: p.sessions || 0
        };
      })
      .filter((item: any) => item.distance <= 15);

    const validDistances = validPoints.map((item: any) => item.distance);

    if (validDistances.length === 0) {
      return { average: 0, stdDev: 0, mode: 0, count: 0, ranges: [] };
    }
    
    // 1. Média
    const sum = validDistances.reduce((acc: number, curr: number) => acc + curr, 0);
    const average = sum / validDistances.length;

    // 2. Desvio Padrão
    const variance = validDistances.reduce((acc: number, curr: number) => acc + Math.pow(curr - average, 2), 0) / validDistances.length;
    const stdDev = Math.sqrt(variance);

    // 3. Moda (arredondando para 1 casa decimal para agrupar)
    const modeCounts: Record<string, number> = {};
    let maxModeCount = 0;
    let mode = validDistances[0];
    validDistances.forEach((d: number) => {
      const rounded = d.toFixed(1);
      modeCounts[rounded] = (modeCounts[rounded] || 0) + 1;
      if (modeCounts[rounded] > maxModeCount) {
        maxModeCount = modeCounts[rounded];
        mode = parseFloat(rounded);
      }
    });

    // 4. Faixas de distância para a tabela
    const intervals = [
      { label: "Muito Próximo (0 a 2 km)", min: 0, max: 2, sumSessions: 0, count: 0 },
      { label: "Próximo (2 a 5 km)", min: 2, max: 5, sumSessions: 0, count: 0 },
      { label: "Médio (5 a 10 km)", min: 5, max: 10, sumSessions: 0, count: 0 },
      { label: "Afastado (10 a 15 km)", min: 10, max: 15, sumSessions: 0, count: 0 }
    ];

    validPoints.forEach((p: any) => {
      for (const interval of intervals) {
        if (p.distance >= interval.min && p.distance < interval.max) {
          interval.sumSessions += p.sessions;
          interval.count++;
          break;
        }
      }
    });

    const ranges = intervals.map(i => ({
      label: i.label,
      count: i.count,
      totalSessions: i.sumSessions,
      averageSessions: i.count > 0 ? i.sumSessions / i.count : 0
    }));

    return { average, stdDev, mode, count: validDistances.length, ranges };
  }, [data]);

  const statsData = useMemo(() => {
    if (!data) return null;
    const { stats } = data;
    const ageData = ClientStatsService.formatAgeChartData(stats.stratifiedAgeData, stats.withProfile);
    
    return { ageData, stats };
  }, [data]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '20px' }}>
      <div className="loader"></div>
      <p style={{ color: 'var(--text-secondary)' }}>Mapeando perfil da clínica...</p>
    </div>
  );

  if (!data || !statsData) return <div>Nenhum dado encontrado. Faça upload do perfil dos pacientes.</div>;

  const { stats, patients, missingProfiles } = data as any;
  const { ageData } = statsData;
  const professionData = stats.allProfessions;
  const provenanceData = stats.allProvenance;
  const diagnosesData = stats.allDiagnoses || [];
  const segmentsData = stats.allSegments || [];

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
            <button 
              onClick={() => setActiveView('inactive')} 
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeView === 'inactive' ? 'white' : 'transparent', color: activeView === 'inactive' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', boxShadow: activeView === 'inactive' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
            >
              Inativos & Reengajamento
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
              ].map((m: any, i: number) => (
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
                    ].map((row: any, i: number) => (
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
                    {stats.stratifiedAgeData.map((row: any, i: number) => {
                      const totalInRange = row.men + row.women;
                      const pct = stats.withProfile > 0 ? ((totalInRange / stats.withProfile) * 100).toFixed(1) : 0;
                      const maxCount = Math.max(...stats.stratifiedAgeData.map((d: any) => Math.max(d.men, d.women)));
                      
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
                          formatter={((val: number, entry: any) => {
                            if (!entry || !entry.payload) return val;
                            return `${val} (${entry.payload.pct}%)`;
                          }) as any}
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
                      {professionData.map((item: any, i: number) => (
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
                      {provenanceData.map((item: any, i: number) => (
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

              {/* Diagnósticos e Segmentos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
                <div className="card chart-card">
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color="#8b5cf6" /> Frequência de Diagnósticos Clínicos
                  </h3>
                  {diagnosesData.length > 0 ? (
                    <div style={{ height: '400px' }} className="chart-container-inner is-expanded">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={diagnosesData.slice(0, 10)} layout="vertical" margin={{ left: 40, right: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontWeight: 600 }} />
                          <Tooltip 
                            isAnimationActive={false}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <p style={{ margin: 0, fontWeight: '800' }}>{payload[0].payload.name}</p>
                                    <p style={{ margin: 0, color: '#8b5cf6' }}>{payload[0].value} pacientes ({payload[0].payload.pct}%)</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={25} isAnimationActive={false}>
                            <LabelList 
                              dataKey="count" 
                              position="right" 
                              formatter={((val: number, entry: any) => {
                                if (!entry || !entry.payload) return val;
                                return `${val} (${entry.payload.pct}%)`;
                              }) as any}
                              style={{ fontSize: '0.8rem', fontWeight: '700', fill: 'var(--text-primary)' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)', height: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <Activity size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '16px' }} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum diagnóstico registrado para os pacientes atendidos neste período.</p>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapIcon size={20} color="#6366f1" /> Segmentos Corporais Acometidos
                  </h3>
                  {segmentsData.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {segmentsData.map((item: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                            <span style={{ fontWeight: '600' }}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.pct}%</span>
                              <span style={{ fontWeight: '800', color: '#6366f1', minWidth: '30px', textAlign: 'right' }}>{item.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)', height: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <MapIcon size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '16px' }} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum segmento corporal registrado para os pacientes atendidos neste período.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'list' && (
          <>
            <div className="fade-in card">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                <input 
                  type="text" 
                  placeholder="Filtrar pacientes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="fisioterapeuta-select" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Fisioterapeuta:</label>
                  <select 
                    id="fisioterapeuta-select"
                    value={selectedProfessional} 
                    onChange={(e) => setSelectedProfessional(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', fontWeight: '600', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="all">Todos os Fisioterapeutas</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={showDischarged} 
                    onChange={(e) => setShowDischarged(e.target.checked)}
                    style={{ width: '18px', height: '18px', borderRadius: '6px', cursor: 'pointer' }}
                  />
                  <span>Mostrar pacientes com alta</span>
                </label>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome do Paciente</th>
                    <th>Gênero</th>
                    <th>Idade</th>
                    <th>Diagnóstico Ativo</th>
                    <th>Fisioterapeuta(s)</th>
                    <th>Profissão</th>
                    <th>Origem</th>
                    <th>Bairro/Procedência</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p: any, i: number) => {
                    const activeDiags = p.diagnoses?.filter((d: any) => d.status === "ATIVO") || [];
                    const isDischarged = p.diagnoses && p.diagnoses.length > 0 && p.diagnoses.every((d: any) => d.status === "ALTA");
                    
                    return (
                      <tr key={i} style={{ opacity: isDischarged ? 0.6 : 1 }}>
                        <td style={{ fontWeight: '700' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.name}
                            {isDischarged && (
                              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: '#e2e8f0', color: '#475569', fontWeight: '800' }}>ALTA</span>
                            )}
                          </div>
                        </td>
                        <td>{p.gender || 'N/I'}</td>
                        <td>{p.age || 'N/I'}</td>
                        <td>
                          {activeDiags.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {activeDiags.map((d: any) => (
                                <span key={d.id} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', background: '#fef2f2', color: '#9d1d1d', border: '1px solid #fecaca', fontWeight: '700' }}>
                                  {d.diagnosis} ({d.segment})
                                </span>
                              ))}
                            </div>
                          ) : isDischarged ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Alta clínica</span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: '600' }}>Sem diagnóstico</span>
                          )}
                        </td>
                        <td>
                          {p.professionals && p.professionals.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {p.professionals.map((prof: any) => (
                                <span key={prof.id} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: '700' }}>
                                  {prof.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhum</span>
                          )}
                        </td>
                        <td>{p.profession || 'N/I'}</td>
                        <td>{p.origin || 'N/I'}</td>
                        <td>{p.provenance || 'N/I'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Histórico de Altas e Frequência de Diagnósticos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '40px' }} className="no-print">
            
            {/* Grid de Colunas para Frequências e Média (50% de largura cada) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              
              {/* Frequência de Diagnósticos */}
              <div className="fade-in card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Activity style={{ color: 'var(--primary)' }} size={22} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Frequência de Diagnósticos (Mes)</h3>
                </div>
                
                {loadingFrequency ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={24} />
                  </div>
                ) : diagnosticsFrequency.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      Nenhum diagnóstico novo registrado para este profissional no período.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
                    {groupFrequencyBySegment(diagnosticsFrequency).map((group, gIdx) => {
                      const isExpanded = !!expandedSegments[`diag-${group.segmentName}`];
                      return (
                        <div key={`g-diag-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div 
                            onClick={() => toggleSegment(`diag-${group.segmentName}`)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '0.75rem 1rem', 
                              background: 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)', 
                              borderRadius: '12px', 
                              border: '1px solid #fee2e2',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.2s ease',
                              fontWeight: '700',
                              color: '#9d1d1d',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{group.segmentName}</span>
                            </div>
                            <span style={{ fontWeight: '800', background: '#A31621', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.725rem' }}>
                              {group.total} {group.total === 1 ? 'caso' : 'casos'} ({group.percentage}%)
                            </span>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderLeft: '1.5px dotted #fee2e2', marginLeft: '20px' }}>
                              {group.items.map((item, idx) => (
                                <div 
                                  key={`g-diag-item-${idx}`} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)'
                                  }}
                                >
                                  <span>• {item.diagnosis}</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {item.count} {item.count === 1 ? 'caso' : 'casos'} ({item.segmentPercentage}% no segmento / {item.totalPercentage}% no total)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="fade-in card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Users style={{ color: '#8b5cf6' }} size={22} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Frequência de Casos (Mes)</h3>
                </div>
                
                {loadingCases ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader2 className="animate-spin" style={{ color: '#8b5cf6' }} size={24} />
                  </div>
                ) : casesFrequency.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      Nenhum caso ativo registrado para este profissional no período.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
                    {groupFrequencyBySegment(casesFrequency).map((group, gIdx) => {
                      const isExpanded = !!expandedSegments[`cases-${group.segmentName}`];
                      return (
                        <div key={`g-cases-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div 
                            onClick={() => toggleSegment(`cases-${group.segmentName}`)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '0.75rem 1rem', 
                              background: 'linear-gradient(135deg, #f5f3ff 0%, #fff 100%)', 
                              borderRadius: '12px', 
                              border: '1px solid #e0e7ff',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.2s ease',
                              fontWeight: '700',
                              color: '#5b21b6',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{group.segmentName}</span>
                            </div>
                            <span style={{ fontWeight: '800', background: '#6d28d9', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.725rem' }}>
                              {group.total} {group.total === 1 ? 'caso' : 'casos'} ({group.percentage}%)
                            </span>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderLeft: '1.5px dotted #e0e7ff', marginLeft: '20px' }}>
                              {group.items.map((item, idx) => (
                                <div 
                                  key={`g-cases-item-${idx}`} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)'
                                  }}
                                >
                                  <span>• {item.diagnosis}</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {item.count} {item.count === 1 ? 'caso' : 'casos'} ({item.segmentPercentage}% no segmento / {item.totalPercentage}% no total)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="fade-in card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp style={{ color: '#10b981' }} size={22} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                      Média de Atendimentos por Diagnóstico {avgPeriodMode === 'all' ? '(Todo período)' : '(Mês atual)'}
                    </h3>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.05)', padding: '2px', borderRadius: '8px' }} className="no-print">
                    <button 
                      onClick={() => setAvgPeriodMode('all')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: avgPeriodMode === 'all' ? 'white' : 'transparent',
                        color: avgPeriodMode === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: avgPeriodMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Todo o Período
                    </button>
                    <button 
                      onClick={() => setAvgPeriodMode('month')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: avgPeriodMode === 'month' ? 'white' : 'transparent',
                        color: avgPeriodMode === 'month' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: avgPeriodMode === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Mês Atual
                    </button>
                  </div>
                </div>
                
                {loadingAvgSessions ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader2 className="animate-spin" style={{ color: '#10b981' }} size={24} />
                  </div>
                ) : averageSessions.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      Nenhuma média calculada (sem altas concluídas) no período.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px', paddingRight: '4px' }}>
                    {groupAverageSessionsBySegment(averageSessions).map((group, gIdx) => {
                      const isExpanded = !!expandedSegments[`avg-${group.segmentName}`];
                      return (
                        <div key={`g-avg-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div 
                            onClick={() => toggleSegment(`avg-${group.segmentName}`)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '0.75rem 1rem', 
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #fff 100%)', 
                              borderRadius: '12px', 
                              border: '1px solid #d1fae5',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.2s ease',
                              fontWeight: '700',
                              color: '#065f46',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{group.segmentName}</span>
                            </div>
                            <span style={{ fontWeight: '800', background: '#059669', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '0.725rem' }}>
                              Média: {group.averageSessions} {group.averageSessions === 1 ? 'sessão' : 'sessões'} ({group.totalCases} {group.totalCases === 1 ? 'alta' : 'altas'} - {group.percentage}%)
                            </span>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', borderLeft: '1.5px dotted #d1fae5', marginLeft: '20px' }}>
                              {group.items.map((item, idx) => (
                                <div 
                                  key={`g-avg-item-${idx}`} 
                                  style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '2px',
                                    padding: '4px 8px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>• {item.diagnosis}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                      ({item.casesCount} {item.casesCount === 1 ? 'alta' : 'altas'} - {item.segmentCasesPercentage}% no segmento / {item.totalCasesPercentage}% no total)
                                    </span>
                                  </div>
                                  <div style={{ paddingLeft: '8px' }}>
                                    <span style={{ background: '#f0fdf4', color: '#166534', fontWeight: '700', borderRadius: '6px', padding: '1px 6px', fontSize: '0.725rem', border: '1px solid #bbf7d0' }}>
                                      {item.averageSessions} {item.averageSessions === 1 ? 'sessão/alta' : 'sessões/alta'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            <div className="fade-in card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <CheckCircle2 style={{ color: '#10b981' }} size={24} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Altas Realizadas (Mes)</h3>
              </div>
              
              {loadingDischarged ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Loader2 className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} size={24} />
                  <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>Carregando histórico de altas...</p>
                </div>
              ) : dischargedDiagnoses.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                  Nenhuma alta clínica registrada para este profissional no período selecionado.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#fafafa' }}>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Paciente</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Segmento</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Diagnóstico</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Data de Início</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Data de Alta</th>
                        <th style={{ padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>Sessões</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dischargedDiagnoses.map((diag) => (
                        <tr key={diag.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{diag.patientName}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: '600', fontSize: '0.75rem' }}>
                              {diag.segment}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{diag.diagnosis}</td>
                          <td style={{ padding: '12px' }}>{new Date(diag.startDate).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {diag.dischargeDate ? new Date(diag.dischargeDate).toLocaleDateString('pt-BR') : 'N/A'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ background: '#eff6ff', color: '#1e40af', fontWeight: '800', borderRadius: '8px', padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #bfdbfe' }}>
                              {diag.sessionCount} {diag.sessionCount === 1 ? 'sessão' : 'sessões'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="fade-in card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <XCircle style={{ color: '#ef4444' }} size={24} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Desistências Realizadas (Mes)</h3>
              </div>
              
              {loadingDropouts ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Loader2 className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} size={24} />
                  <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>Carregando histórico de desistências...</p>
                </div>
              ) : dropoutDiagnoses.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                  Nenhuma desistência registrada para este profissional no período selecionado.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', background: '#fafafa' }}>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Paciente</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Segmento</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Diagnóstico</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Data de Início</th>
                        <th style={{ padding: '12px', fontWeight: 'bold' }}>Data de Desistência</th>
                        <th style={{ padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>Sessões</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dropoutDiagnoses.map((diag) => (
                        <tr key={diag.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{diag.patientName}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: '600', fontSize: '0.75rem' }}>
                              {diag.segment}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{diag.diagnosis}</td>
                          <td style={{ padding: '12px' }}>{new Date(diag.startDate).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {diag.dischargeDate ? new Date(diag.dischargeDate).toLocaleDateString('pt-BR') : 'N/A'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ background: '#fef2f2', color: '#991b1b', fontWeight: '800', borderRadius: '8px', padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #fca5a5' }}>
                              {diag.sessionCount} {diag.sessionCount === 1 ? 'sessão' : 'sessões'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </>
      )}

        {activeView === 'map' && (
          <div className="fade-in card" style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  {geocoding ? (geocodingText || "Processando...") : "Geocodificar Endereços"}
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }} className="map-container-print">
              {hasGoogleMapsApiKey && isLoaded && typeof window !== 'undefined' && !!(window as any).google?.maps ? (
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
                  {heatmapPoints.length > 0 && hasGoogleMapsApiKey && isLoaded && typeof window !== 'undefined' && !!(window as any).google?.maps?.visualization?.HeatmapLayer && (
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
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div 
                    ref={leafletContainerRef} 
                    id="leaflet-map" 
                    style={{ width: '100%', height: '100%', minHeight: '400px', zIndex: 1 }} 
                  />
                  {!leafletLoaded && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '15px', padding: '40px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#f8fafc', zIndex: 2 }}>
                      <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} size={32} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando mapa alternativo...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Estatísticas Geográficas do Mapa */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }} className="no-print">
              {/* Card 1: Pacientes Mapeados */}
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <MapIcon size={20} />
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500', display: 'block' }}>Pacientes Mapeados</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    {distanceStats.count}
                  </span>
                </div>
              </div>

              {/* Card 2: Distância Média */}
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Navigation size={20} />
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500', display: 'block' }}>Distância Média</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    {distanceStats.average !== null ? `${distanceStats.average.toFixed(2)} km` : "Calculando..."}
                  </span>
                </div>
              </div>

              {/* Card 3: Desvio Padrão */}
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500', display: 'block' }}>Desvio Padrão</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    {distanceStats.stdDev !== null ? `${distanceStats.stdDev.toFixed(2)} km` : "Calculando..."}
                  </span>
                </div>
              </div>

              {/* Card 4: Moda */}
              <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500', display: 'block' }}>Moda Geográfica</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    {distanceStats.mode !== null ? `${distanceStats.mode.toFixed(1)} km` : "Calculando..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de Adesão por Faixa de Distância */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" /> Adesão por Faixa de Distância no Período
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Mapeamento da retenção e volume de sessões conforme a proximidade residencial do paciente.
              </p>
              
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'white' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Faixa de Distância</th>
                      <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Pacientes Mapeados</th>
                      <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Sessões Totais</th>
                      <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Média de Sessões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distanceStats.ranges.map((range: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{range.label}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>{range.count}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>{range.totalSessions}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            background: range.averageSessions >= 20 ? '#dcfce7' : range.averageSessions >= 10 ? '#eff6ff' : '#f1f5f9', 
                            color: range.averageSessions >= 20 ? '#15803d' : range.averageSessions >= 10 ? '#1e40af' : '#475569', 
                            fontWeight: '800', 
                            borderRadius: '8px', 
                            padding: '4px 10px', 
                            fontSize: '0.85rem',
                            border: `1px solid ${range.averageSessions >= 20 ? '#bbf7d0' : range.averageSessions >= 10 ? '#bfdbfe' : '#e2e8f0'}`
                          }}>
                            {range.averageSessions.toFixed(1)} sessões
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'inactive' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {loadingInactive ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '20px' }}>
                <div className="loader"></div>
                <p style={{ color: 'var(--text-secondary)' }}>Carregando dados de reengajamento...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
                {/* Column 1: Inactive Patients List */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: '800' }}>
                    <Clock size={20} color="var(--primary)" /> Pacientes Inativos (+14 dias sem agenda)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
                    {inactiveData?.inactivePatients && inactiveData.inactivePatients.length > 0 ? (
                      inactiveData.inactivePatients.map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.015)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <div>
                            <h4 style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1rem' }}>{p.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>Última sessão: <strong>{new Date(p.lastSessionDate).toLocaleDateString('pt-BR')}</strong></span>
                              <span>•</span>
                              <span style={{ color: p.daysInactive > 30 ? 'var(--danger)' : '#f59e0b', fontWeight: '700' }}>{p.daysInactive} dias inativo</span>
                            </p>
                            {p.lastContactedAt && (
                              <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> Último contato: {new Date(p.lastContactedAt).toLocaleDateString('pt-BR')} às {new Date(p.lastContactedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleTriggerReengagement(p.id)}
                            disabled={triggeringId === p.id}
                            className="btn"
                            style={{
                              padding: '10px 16px',
                              background: '#25D366',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '800',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)',
                              cursor: 'pointer'
                            }}
                          >
                            {triggeringId === p.id ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <MessageSquare size={14} />
                            )}
                            Disparar
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum paciente inativo no momento. Todos estão assíduos!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Feedbacks List */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: '800' }}>
                    <MessageSquare size={20} color="#6366f1" /> Feedbacks e Motivos de Ausência
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
                    {inactiveData?.feedbacks && inactiveData.feedbacks.length > 0 ? (
                      inactiveData.feedbacks.map((f: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{f.patientName}</h4>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Recebido em: {new Date(f.date).toLocaleDateString('pt-BR')} às {new Date(f.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: f.reason.includes('Melhor') ? '#dcfce7' : f.reason.includes('Financeiro') ? '#dbeafe' : '#fef3c7',
                              color: f.reason.includes('Melhor') ? '#15803d' : f.reason.includes('Financeiro') ? '#1e40af' : '#b45309'
                            }}>
                              {f.reason}
                            </span>
                          </div>
                          {f.comment && (
                            <div style={{
                              background: 'white',
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.5',
                              fontStyle: 'italic'
                            }}>
                              &ldquo;{f.comment}&rdquo;
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum feedback de paciente inativo recebido ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <PatientAICopilotSection startMonth={startMonth} startYear={startYear} endMonth={endMonth} endYear={endYear} />
    </div>
  );
}

function PatientAICopilotSection({ startMonth, startYear, endMonth, endYear }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestions = [
    { label: "📊 Evasão por Bairro/Profissão", query: "Analise se os pacientes inativos ou com mais dias sem agendamento possuem alguma correlação estatística clara com o bairro (procedência) onde moram ou com suas profissões." },
    { label: "🩺 Patologias por Perfil", query: "Quais são as patologias (diagnósticos) mais frequentes na clínica e como elas se distribuem entre os gêneros (feminino/masculino) e faixas etárias dos pacientes?" },
    { label: "🔄 Estratégia para Inativos", query: "Com base na lista de pacientes inativos e nos motivos fornecidos nos feedbacks, elabore um plano estratégico acionável de 3 passos para reengajar esses pacientes." }
  ];

  const handleAsk = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await fetch("/api/patients/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          startMonth,
          startYear,
          endMonth,
          endYear
        })
      });

      if (res.status === 401) {
        setError("Sua sessão expirou. Redirecionando para a página de login...");
        setTimeout(() => {
          window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
        }, 1500);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar o Agente de IA.");
      }
      setResponse(data.text);
    } catch (e: any) {
      console.warn("Erro no Agente de IA:", e);
      setError(e.message || "Erro na comunicação com o Agente de IA.");
    } finally {
      setLoading(false);
    }
  };

  const formattedResponse = useMemo(() => {
    if (!response) return "";
    let html = response
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, "<code style='background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; font-family: monospace;'>$1</code>");

    const lines = html.split('\n');
    let inList = false;
    let inTable = false;
    
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (/^[|\s-]+$/.test(trimmed)) {
          return '';
        }
        const cells = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        let prefix = '';
        if (!inTable) {
          prefix = '<div style="overflow-x:auto; margin: 16px 0;"><table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.8rem; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px;">';
          inTable = true;
          const headerCells = cells.map(c => `<th style="padding:10px; border-bottom:2px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.02); font-weight:700;">${c}</th>`).join('');
          return `${prefix}<thead><tr>${headerCells}</tr></thead><tbody>`;
        }
        const rowCells = cells.map(c => `<td style="padding:10px; border-bottom:1px solid rgba(0,0,0,0.06);">${c}</td>`).join('');
        return `<tr>${rowCells}</tr>`;
      } else {
        let suffix = '';
        if (inTable) {
          suffix = '</tbody></table></div>';
          inTable = false;
        }
        
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          let prefixList = '';
          if (!inList) {
            prefixList = '<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">';
            inList = true;
          }
          return `${suffix}${prefixList}<li style="margin: 6px 0;">${content}</li>`;
        } else {
          let suffixList = '';
          if (inList) {
            suffixList = '</ul>';
            inList = false;
          }
          return `${suffix}${suffixList}${line}`;
        }
      }
    });

    if (inTable) formattedLines.push('</tbody></table></div>');
    if (inList) formattedLines.push('</ul>');

    return formattedLines.filter(line => line !== '').join('<br />')
      .replace(/<\/ul><br \/>/g, "</ul>")
      .replace(/<br \/><ul/g, "<ul")
      .replace(/<\/div><br \/>/g, "</div>")
      .replace(/<br \/><div/g, "<div");
  }, [response]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Sparkles size={24} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
            borderLeft: '1px solid #cbd5e1'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f5f3ff 100%)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <TrendingUp size={18} style={{ transform: 'rotate(45deg)', color: '#8b5cf6' }} />
                  Agente de IA - Pacientes Kinesis
                </h3>
                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', margin: '2px 0 0 0' }}>Análise de Padrões & Agendamentos</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#f8fafc'
            }}>
              {!response && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Análises Recomendadas:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPrompt(s.query);
                          handleAsk(s.query);
                        }}
                        style={{
                          background: '#eff6ff',
                          color: '#1e40af',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(response || loading || error) && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  lineHeight: '1.6',
                  color: '#1e293b'
                }}>
                  {loading && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#64748b' }}>
                      <Loader2 className="animate-spin" size={14} strokeWidth={3} />
                      <span style={{ marginLeft: '6px' }}>Analisando padrões demográficos e agendamentos...</span>
                    </div>
                  )}
                  {error && <span style={{ color: '#ef4444' }}>⚠️ {error}</span>}
                  {response && (
                    <div 
                      style={{ whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: formattedResponse }} 
                    />
                  )}
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAsk(prompt); }} style={{
              padding: '16px 20px',
              borderTop: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Pergunte sobre bairros, profissões, inativos..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <button 
                type="submit"
                disabled={loading || !prompt.trim()}
                style={{
                  backgroundColor: prompt.trim() && !loading ? '#8b5cf6' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
