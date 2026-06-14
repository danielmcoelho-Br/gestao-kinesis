"use client";

import { useEffect, useState, useRef } from "react";
import { ReportHeader } from "@/gestao/components/ReportHeader";
import { 
  Megaphone, Search, FileText, Palette, CheckCircle, 
  Sparkles, Loader2, Copy, Trash2, Edit3, Check, 
  Plus, Calendar, Info, RefreshCw, Eye, MessageSquare, Send, X, Download,
  Archive, Smartphone, Heart, MessageCircle, Share2, Compass, Sliders
} from "lucide-react";
import { toast } from "sonner";

interface MarketingPost {
  id: string;
  weekStart: string;
  dayOfWeek: string;
  title: string;
  sourceTopic: string;
  content: string;
  imagePrompt: string;
  imageUrl: string | null;
  status: string; // DRAFT, APPROVED, POSTED, ARCHIVED
  storyContent: string | null;
}

interface StorySlide {
  slideNumber: number;
  text: string;
  visualPrompt: string;
  imageUrl?: string | null;
  sticker?: {
    type: "poll" | "question" | "slider" | "none";
    question?: string;
    options?: string[];
  };
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "stories" | "archived">("calendar");
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1); // -1: idle, 0: search, 1: write, 2: design, 3: review
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Topic focus state
  const [focusAreas, setFocusAreas] = useState<string[]>(["ORTOPEDIA", "PILATES"]);
  const [customKeywords, setCustomKeywords] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Editing state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImagePrompt, setEditImagePrompt] = useState("");
  const [editStoryContent, setEditStoryContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [cardSubTabs, setCardSubTabs] = useState<Record<string, "feed" | "story">>({});

  // Archived state
  const [archivedPosts, setArchivedPosts] = useState<MarketingPost[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  // Chat State
  const [chatAttachedImage, setChatAttachedImage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; image?: string }>>([
    {
      role: "assistant",
      content: "Olá! Sou seu Assistente de Marketing de IA da Clínica Kinesis. \n\nPosso ajudar você a criar ideias para posts de redes sociais, refinar legendas, sugerir imagens, prompts e planejar estratégias para atrair mais pacientes. \n\nComo posso ajudar você hoje?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showAIChat, setShowAIChat] = useState(false);

  // Stories Studio State
  const [storyTheme, setStoryTheme] = useState("");
  const [storyTone, setStoryTone] = useState("Educativo");
  const [storyQuantity, setStoryQuantity] = useState(3);
  const [storyList, setStoryList] = useState<StorySlide[]>([]);
  const [storyGenerating, setStoryGenerating] = useState(false);
  const [storyImageGeneratingIndex, setStoryImageGeneratingIndex] = useState<number | null>(null);
  const [activeStoryPreviewIndex, setActiveStoryPreviewIndex] = useState(0);
  const [votedPollSticker, setVotedPollSticker] = useState<Record<number, string>>({});
  const [editingStoryIndex, setEditingStoryIndex] = useState<number | null>(null);
  const [editStoryText, setEditStoryText] = useState("");

  const storySuggestions = [
    "Benefícios do Pilates para Idosos",
    "Postura de quem trabalha sentado",
    "Prevenção de entorses no Futebol",
    "Mitos sobre dor nas costas",
    "Alongamento matinal em 5 min"
  ];

  const exportStoryAsImage = (slide: StorySlide) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawBackgroundAndContent = (bgImage?: HTMLImageElement) => {
      // 1. Background
      if (bgImage) {
        const imgWidth = bgImage.width;
        const imgHeight = bgImage.height;
        const canvasRatio = 1080 / 1920;
        const imgRatio = imgWidth / imgHeight;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        if (imgRatio > canvasRatio) {
          drawHeight = 1920;
          drawWidth = 1920 * imgRatio;
          offsetX = (1080 - drawWidth) / 2;
        } else {
          drawWidth = 1080;
          drawHeight = 1080 / imgRatio;
          offsetY = (1920 - drawHeight) / 2;
        }
        ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, "#A31621");
        grad.addColorStop(1, "#1e293b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);
      }

      // 2. Status Progress Bars
      const totalSlides = storyList.length;
      const barSpacing = 12;
      const topBarY = 40;
      const topBarHeight = 10;
      const totalAvailableWidth = 1080 - 80;
      const barWidth = (totalAvailableWidth - (barSpacing * (totalSlides - 1))) / totalSlides;

      for (let i = 0; i < totalSlides; i++) {
        const barX = 40 + i * (barWidth + barSpacing);
        ctx.fillStyle = i === activeStoryPreviewIndex 
          ? "rgba(255, 255, 255, 1)" 
          : (i < activeStoryPreviewIndex ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.35)");
        drawRoundedRect(ctx, barX, topBarY, barWidth, topBarHeight, 5);
        ctx.fill();
      }

      // 3. User Profile Header
      ctx.fillStyle = "#A31621";
      ctx.beginPath();
      ctx.arc(80, 120, 40, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#fff";
      ctx.font = "800 44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("K", 80, 120);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px sans-serif";
      ctx.fillText("kinesis_clinica", 140, 105);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "30px sans-serif";
      ctx.fillText("Patrocinado", 140, 145);

      // 4. Text Box Overlay
      const textBoxWidth = 960;
      const textBoxX = 60;
      const textBoxY = 320;
      
      ctx.font = "700 48px sans-serif";
      const words = slide.text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? currentLine + " " + words[i] : words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > textBoxWidth - 80) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      const lineGap = 16;
      const lineHeight = 48 + lineGap;
      const textBoxHeight = (lines.length * lineHeight) + 80;

      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, textBoxX, textBoxY, textBoxWidth, textBoxHeight, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      lines.forEach((line, index) => {
        ctx.fillText(line, 1080 / 2, textBoxY + 40 + (index * lineHeight));
      });

      // 5. Interactive Sticker
      if (slide.sticker && slide.sticker.type !== "none") {
        const stickerY = textBoxY + textBoxHeight + 80;
        const stickerWidth = 600;
        const stickerX = (1080 - stickerWidth) / 2;

        if (slide.sticker.type === "poll") {
          ctx.fillStyle = "#ffffff";
          drawRoundedRect(ctx, stickerX, stickerY, stickerWidth, 380, 36);
          ctx.fill();

          ctx.fillStyle = "#475569";
          ctx.font = "bold 32px sans-serif";
          ctx.textAlign = "center";
          wrapAndDrawText(ctx, slide.sticker.question || "", 1080 / 2, stickerY + 40, stickerWidth - 60, 38);

          const opts = slide.sticker.options || ["Sim", "Não"];
          opts.forEach((opt, idx) => {
            const optY = stickerY + 160 + (idx * 90);
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, stickerX + 40, optY, stickerWidth - 80, 70, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#334155";
            ctx.font = "bold 30px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(opt, stickerX + 80, optY + 35);
          });
        } else if (slide.sticker.type === "question") {
          const grad = ctx.createLinearGradient(stickerX, stickerY, stickerX + stickerWidth, stickerY + 320);
          grad.addColorStop(0, "#ff007f");
          grad.addColorStop(1, "#7f00ff");
          ctx.fillStyle = grad;
          drawRoundedRect(ctx, stickerX, stickerY, stickerWidth, 320, 36);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 32px sans-serif";
          ctx.textAlign = "center";
          wrapAndDrawText(ctx, slide.sticker.question || "Faça uma pergunta...", 1080 / 2, stickerY + 40, stickerWidth - 60, 38);

          ctx.fillStyle = "#ffffff";
          drawRoundedRect(ctx, stickerX + 40, stickerY + 180, stickerWidth - 80, 80, 20);
          ctx.fill();

          ctx.fillStyle = "#94a3b8";
          ctx.font = "28px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("Escreva uma resposta...", stickerX + 70, stickerY + 220);
        } else if (slide.sticker.type === "slider") {
          ctx.fillStyle = "#ffffff";
          drawRoundedRect(ctx, stickerX, stickerY, stickerWidth, 240, 36);
          ctx.fill();

          ctx.fillStyle = "#475569";
          ctx.font = "bold 32px sans-serif";
          ctx.textAlign = "center";
          wrapAndDrawText(ctx, slide.sticker.question || "O quanto você concorda?", 1080 / 2, stickerY + 40, stickerWidth - 60, 38);

          ctx.fillStyle = "#e2e8f0";
          drawRoundedRect(ctx, stickerX + 40, stickerY + 150, stickerWidth - 80, 16, 8);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(stickerX + 40 + ((stickerWidth - 80) * 0.7), stickerY + 158, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.1)";
          ctx.stroke();

          ctx.font = "40px sans-serif";
          ctx.fillText("🔥", stickerX + 40 + ((stickerWidth - 80) * 0.7), stickerY + 158);
        }
      }

      // 6. Footer message bar
      const footerY = 1780;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, 60, footerY, 820, 80, 40);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "italic 28px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Enviar mensagem...", 100, footerY + 40);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(960, footerY + 20);
      ctx.lineTo(1010, footerY + 40);
      ctx.lineTo(960, footerY + 60);
      ctx.lineTo(975, footerY + 40);
      ctx.closePath();
      ctx.fill();

      // Download
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `story-slide-${activeStoryPreviewIndex + 1}.png`;
        link.href = dataUrl;
        link.click();
        toast.success(`Slide ${activeStoryPreviewIndex + 1} exportado com sucesso!`);
      } catch (e) {
        console.error("Erro ao gerar data URL:", e);
        toast.error("Erro de segurança no canvas (CORS). Tente baixar a imagem do story primeiro.");
      }
    };

    function drawRoundedRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }

    function wrapAndDrawText(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lHeight: number) {
      const w = text.split(" ");
      let line = "";
      let curY = y;
      
      for (let n = 0; n < w.length; n++) {
        const testLine = line ? line + " " + w[n] : w[n];
        const metrics = c.measureText(testLine);
        if (metrics.width > maxWidth) {
          c.fillText(line, x, curY);
          line = w[n];
          curY += lHeight;
        } else {
          line = testLine;
        }
      }
      c.fillText(line, x, curY);
    }

    if (slide.imageUrl) {
      toast.info("Processando imagem do story...");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = slide.imageUrl;
      img.onload = () => {
        drawBackgroundAndContent(img);
      };
      img.onerror = () => {
        console.warn("Erro ao carregar imagem, exportando com gradiente.");
        drawBackgroundAndContent();
      };
    } else {
      drawBackgroundAndContent();
    }
  };

  useEffect(() => {
    if (showAIChat) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showAIChat]);

  // Load posts for the selected week
  const loadPosts = async (mondayDate: Date) => {
    setLoading(true);
    try {
      const mondayStr = mondayDate.toISOString().split('T')[0];
      const res = await fetch(`/api/marketing?weekStart=${mondayStr}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        toast.error("Erro ao carregar planejamento semanal.");
      }
    } catch (e) {
      toast.error("Falha ao comunicar com a base de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFailedImageIds([]); // Clear failed images state on week change
    loadPosts(currentWeekMonday);
  }, [currentWeekMonday]);

  // Load archived posts
  const loadArchivedPosts = async () => {
    setLoadingArchived(true);
    try {
      const res = await fetch("/api/marketing?archived=true");
      if (res.ok) {
        const data = await res.json();
        setArchivedPosts(data);
      } else {
        toast.error("Erro ao carregar postagens arquivadas.");
      }
    } catch (e) {
      toast.error("Falha ao comunicar com a base de dados.");
    } finally {
      setLoadingArchived(false);
    }
  };

  useEffect(() => {
    if (activeTab === "archived") {
      loadArchivedPosts();
    }
  }, [activeTab]);

  // Load Stories from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem("kinesis_stories");
    if (saved) {
      try {
        setStoryList(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao ler localstorage para stories:", e);
      }
    }
  }, []);

  // Trigger sequential image generation for any posts missing an image
  useEffect(() => {
    const postsMissingImage = posts.filter(p => 
      !p.imageUrl && 
      !failedImageIds.includes(p.id)
    );
    
    if (postsMissingImage.length === 0 || regeneratingImageId) {
      return;
    }

    const postToGenerate = postsMissingImage[0];
    
    const autoGenerate = async () => {
      setRegeneratingImageId(postToGenerate.id);
      try {
        const res = await fetch("/api/marketing/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: postToGenerate.id })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setPosts(prev => prev.map(p => p.id === postToGenerate.id ? { ...p, imageUrl: data.imageUrl } : p));
          } else {
            setFailedImageIds(prev => [...prev, postToGenerate.id]);
          }
        } else {
          setFailedImageIds(prev => [...prev, postToGenerate.id]);
        }
      } catch (e) {
        console.error("Erro ao gerar imagem automaticamente:", e);
        setFailedImageIds(prev => [...prev, postToGenerate.id]);
      } finally {
        setRegeneratingImageId(null);
      }
    };

    autoGenerate();
  }, [posts, regeneratingImageId, failedImageIds]);

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handlePasteInSource = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setCustomImage(event.target.result as string);
              toast.success("Imagem colada da área de transferência!");
            }
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  };

  // Run the multi-agent generation pipeline
  const handleGenerate = async () => {
    setGenerating(true);
    setFailedImageIds([]); // Clear failed images state on new generation
    setPosts([]);
    
    // Simulate steps of the agents
    setActiveStep(0); // Search Agent
    await new Promise(r => setTimeout(r, 2000));
    
    setActiveStep(1); // Copywriter Agent
    await new Promise(r => setTimeout(r, 2000));
    
    setActiveStep(2); // Designer Agent
    await new Promise(r => setTimeout(r, 2000));
    
    setActiveStep(3); // Reviewer Agent
    await new Promise(r => setTimeout(r, 1500));

    try {
      const mondayStr = currentWeekMonday.toISOString().split('T')[0];
      const res = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: mondayStr,
          focusAreas,
          customKeywords,
          customSource,
          customImage
        })
      });

      if (res.ok) {
        const result = await res.json();
        setPosts(result.posts);
        setCustomImage(null); // Clear selected custom image on success
        toast.success("Planejamento semanal gerado com sucesso!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro na geração das postagens.");
      }
    } catch (e) {
      toast.error("Falha de conexão com a API de geração.");
    } finally {
      setGenerating(false);
      setActiveStep(-1);
    }
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  // Delete post
  const handleDeletePost = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este post permanentemente?")) return;
    try {
      const res = await fetch(`/api/marketing/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        setArchivedPosts(prev => prev.filter(p => p.id !== id));
        toast.success("Post removido.");
      } else {
        toast.error("Falha ao remover postagem.");
      }
    } catch (e) {
      toast.error("Erro ao deletar postagem.");
    }
  };

  // Update status of post
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/marketing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        setArchivedPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

        if (newStatus === "ARCHIVED") {
          const archivedPost = posts.find(p => p.id === id);
          setPosts(prev => prev.filter(p => p.id !== id));
          if (archivedPost) {
            setArchivedPosts(prev => [...prev, { ...archivedPost, status: newStatus }]);
          }
          toast.success("Post arquivado com sucesso.");
        } else {
          setArchivedPosts(prev => prev.filter(p => p.id !== id));
          loadPosts(currentWeekMonday);
          toast.success(`Status atualizado para ${newStatus}.`);
        }
      } else {
        toast.error("Erro ao atualizar status.");
      }
    } catch (e) {
      toast.error("Falha ao enviar alteração.");
    }
  };

  // Start edit mode
  const startEdit = (post: MarketingPost) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditImagePrompt(post.imagePrompt);
    setEditStoryContent(post.storyContent || "");
    setEditImageUrl(post.imageUrl);
  };

  // Save edits
  const saveEdits = async () => {
    if (!editingPostId) return;
    try {
      const res = await fetch(`/api/marketing/${editingPostId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          imagePrompt: editImagePrompt,
          storyContent: editStoryContent,
          imageUrl: editImageUrl
        })
      });

      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === editingPostId ? {
          ...p,
          title: editTitle,
          content: editContent,
          imagePrompt: editImagePrompt,
          storyContent: editStoryContent,
          imageUrl: editImageUrl
        } : p));
        setArchivedPosts(prev => prev.map(p => p.id === editingPostId ? {
          ...p,
          title: editTitle,
          content: editContent,
          imagePrompt: editImagePrompt,
          storyContent: editStoryContent,
          imageUrl: editImageUrl
        } : p));
        setEditingPostId(null);
        toast.success("Postagem atualizada com sucesso!");
      } else {
        toast.error("Falha ao salvar edições.");
      }
    } catch (e) {
      toast.error("Erro ao atualizar postagem.");
    }
  };

  // Regenerate image
  const handleRegenerateImage = async (post: MarketingPost) => {
    if (regeneratingImageId !== null) return;
    setRegeneratingImageId(post.id);
    setFailedImageIds(prev => prev.filter(id => id !== post.id));
    
    try {
      const res = await fetch("/api/marketing/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, imageUrl: data.imageUrl } : p));
          toast.success("Imagem gerada com sucesso!");
        } else {
          setFailedImageIds(prev => [...prev, post.id]);
          toast.error("Falha ao obter imagem.");
        }
      } else {
        const data = await res.json();
        setFailedImageIds(prev => [...prev, post.id]);
        toast.error(data.error || "Falha ao obter imagem.");
      }
    } catch (e: any) {
      setFailedImageIds(prev => [...prev, post.id]);
      toast.error(e.message || "Erro ao regenerar imagem.");
    } finally {
      setRegeneratingImageId(null);
    }
  };

  // Chat conversation
  const handleSendChatMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() && !chatAttachedImage) return;

    const userMessage = { 
      role: "user" as const, 
      content: textToSend,
      image: chatAttachedImage || undefined
    };
    const updatedMessages = [...chatMessages, userMessage];

    setChatMessages(updatedMessages);
    if (!customText) setChatInput("");
    setChatAttachedImage(null);
    setChatLoading(true);

    try {
      const res = await fetch("/api/marketing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        toast.error("Falha ao obter resposta do agente de marketing.");
      }
    } catch (e) {
      toast.error("Erro ao conectar ao assistente de marketing.");
    } finally {
      setChatLoading(false);
    }
  };

  // Week navigation
  const adjustWeek = (weeks: number) => {
    const nextMonday = new Date(currentWeekMonday);
    nextMonday.setDate(currentWeekMonday.getDate() + (weeks * 7));
    setCurrentWeekMonday(nextMonday);
  };

  const getWeekRangeLabel = () => {
    const monday = currentWeekMonday;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const format = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `Semana de ${format(monday)} a ${format(sunday)} de ${monday.getFullYear()}`;
  };

  // Stories Generation
  const handleGenerateStories = async () => {
    if (!storyTheme.trim()) {
      toast.error("Por favor, digite um tema ou escolha um das sugestões.");
      return;
    }

    setStoryGenerating(true);
    setStoryList([]);
    setVotedPollSticker({});

    try {
      const res = await fetch("/api/marketing/generate-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: storyTheme,
          tone: storyTone,
          quantity: storyQuantity
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stories) {
          setStoryList(data.stories);
          localStorage.setItem("kinesis_stories", JSON.stringify(data.stories));
          setActiveStoryPreviewIndex(0);
          toast.success("Sequência de Stories gerada com sucesso!");
          
          // Auto-trigger image generation for stories
          generateStoriesImages(data.stories);
        } else {
          toast.error("Erro ao interpretar retorno da IA.");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Falha ao gerar stories.");
      }
    } catch (e) {
      toast.error("Erro ao conectar à API de geração de stories.");
    } finally {
      setStoryGenerating(false);
    }
  };

  // Generate vertical images for all stories sequentially
  const generateStoriesImages = async (stories: StorySlide[]) => {
    const listToWork = [...stories];
    for (let i = 0; i < listToWork.length; i++) {
      if (listToWork[i].imageUrl) continue;
      
      setStoryImageGeneratingIndex(i);
      try {
        const res = await fetch("/api/marketing/generate-story-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visualPrompt: listToWork[i].visualPrompt })
        });
        
        if (res.ok) {
          const result = await res.json();
          if (result.imageUrl) {
            listToWork[i].imageUrl = result.imageUrl;
            setStoryList([...listToWork]);
            localStorage.setItem("kinesis_stories", JSON.stringify(listToWork));
          }
        }
      } catch (e) {
        console.error("Erro ao gerar imagem para o slide " + (i + 1), e);
      }
    }
    setStoryImageGeneratingIndex(null);
  };

  const handleRegenerateStoryImage = async (index: number) => {
    const updated = [...storyList];
    setStoryImageGeneratingIndex(index);
    try {
      const res = await fetch("/api/marketing/generate-story-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visualPrompt: updated[index].visualPrompt })
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.imageUrl) {
          updated[index].imageUrl = result.imageUrl;
          setStoryList(updated);
          localStorage.setItem("kinesis_stories", JSON.stringify(updated));
          toast.success("Imagem do story regenerada com sucesso!");
        } else {
          toast.error("Falha ao obter imagem da IA.");
        }
      } else {
        toast.error("Erro ao gerar nova imagem.");
      }
    } catch (e) {
      toast.error("Erro de rede ao regenerar imagem.");
    } finally {
      setStoryImageGeneratingIndex(null);
    }
  };

  const startEditStory = (index: number) => {
    setEditingStoryIndex(index);
    setEditStoryText(storyList[index].text);
  };

  const saveEditStory = (index: number) => {
    const updated = [...storyList];
    updated[index].text = editStoryText;
    setStoryList(updated);
    localStorage.setItem("kinesis_stories", JSON.stringify(updated));
    setEditingStoryIndex(null);
    toast.success("Texto do story atualizado!");
  };

  const copyAllStoriesText = () => {
    const text = storyList.map((s, idx) => `SLIDE ${idx + 1}:\n${s.text}\n\n[Sugestão de Visual: ${s.visualPrompt}]\n${s.sticker && s.sticker.type !== 'none' ? `[Sticker ${s.sticker.type.toUpperCase()}: ${s.sticker.question} ${s.sticker.options ? `(${s.sticker.options.join(" / ")})` : ""}]` : ""}`).join("\n---------------------------\n");
    copyToClipboardDirect(text, "Toda a sequência de stories");
  };

  const copyToClipboardDirect = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado com sucesso!`);
  };

  return (
    <div className="dashboard-container" style={{ padding: '12px 0px', maxWidth: '1400px', margin: '0 auto' }}>
      <ReportHeader title="Central de Marketing IA" />

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #cbd5e1',
        marginBottom: '24px',
        paddingBottom: '2px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab("calendar")}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === "calendar" ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === "calendar" ? 'var(--primary)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Calendar size={18} />
          Calendário de Posts
        </button>
        <button
          onClick={() => setActiveTab("stories")}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === "stories" ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === "stories" ? 'var(--primary)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Smartphone size={18} />
          Estúdio de Stories
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            fontWeight: 800
          }}>NOVO</span>
        </button>

        <button
          onClick={() => setActiveTab("archived")}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === "archived" ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === "archived" ? 'var(--primary)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Archive size={18} />
          Posts Arquivados
        </button>
      </div>

      {activeTab === "calendar" ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-12">
          {/* Collapsible/Sidebar configuration for guidelines */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="card-modern" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Sparkles size={18} color="var(--primary)" />
                  Diretrizes de Geração
                </h3>
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                  style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {sidebarOpen ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              
              {sidebarOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Areas of Interest */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Focos Clínicos</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {["ORTOPEDIA", "GERIATRIA", "REUMATOLOGIA", "PILATES", "NUTRIÇÃO", "BEM ESTAR"].map(area => {
                        const active = focusAreas.includes(area);
                        return (
                          <button
                            key={area}
                            onClick={() => toggleFocusArea(area)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '16px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              border: active ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                              background: active ? 'var(--primary-light, #eff6ff)' : '#f8fafc',
                              color: active ? 'var(--primary)' : '#475569',
                              transition: 'all 0.15s'
                            }}
                          >
                            {area}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Palavras-Chave</label>
                    <input
                      type="text"
                      placeholder="Ex: Escoliose, Liberação miofascial..."
                      value={customKeywords}
                      onChange={(e) => setCustomKeywords(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Source Raw Text */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Reescrever Artigo / Link</label>
                    <textarea
                      placeholder="Cole um texto bruto ou dê Ctrl+V para imagens..."
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                      onPaste={handlePasteInSource}
                      style={{
                        width: '100%',
                        minHeight: '70px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {/* Custom Image Preview */}
                  {customImage && (
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px' }}>Foto Base Carregada</label>
                      <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={customImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => setCustomImage(null)} 
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.6rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Week Selector */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px' }}>Semana de Trabalho</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <button onClick={() => adjustWeek(-1)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>‹ Ant</button>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {currentWeekMonday.getDate()}/{currentWeekMonday.getMonth() + 1}
                      </span>
                      <button onClick={() => adjustWeek(1)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Prox ›</button>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textAlign: 'center', marginBottom: '14px' }}>
                      {getWeekRangeLabel()}
                    </span>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {generating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    {generating ? "Processando Agentes..." : "Gerar Planejamento"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Posts Calendar & Generation status */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Simulation pipeline box */}
            {generating && (
              <div className="card-modern" style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center', letterSpacing: '0.05em' }}>Esquadrão de Agentes IA em Execução</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { label: "Pesquisador", icon: Search },
                    { label: "Redator", icon: FileText },
                    { label: "Designer", icon: Palette },
                    { label: "Revisor", icon: CheckCircle }
                  ].map((step, idx) => {
                    const active = activeStep === idx;
                    const completed = activeStep > idx;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '8px', 
                          borderRadius: '8px', 
                          background: active ? '#fff' : 'transparent',
                          border: active ? '1px solid var(--primary)' : '1px solid transparent',
                          opacity: active || completed ? 1 : 0.4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: completed ? '#d1fae5' : (active ? 'var(--primary-light, #eff6ff)' : '#e2e8f0'),
                          color: completed ? '#059669' : (active ? 'var(--primary)' : '#475569'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '4px'
                        }}>
                          {completed ? <Check size={14} /> : <step.icon size={14} className={active ? "animate-pulse" : ""} />}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: active ? 'var(--primary)' : '#1e293b' }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
                <Loader2 className="animate-spin" size={36} color="var(--primary)" />
                <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>Carregando postagens...</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#fff' }}>
                <Megaphone size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#475569', margin: 0 }}>Nenhum planejamento para esta semana.</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>Configure os temas e clique em "Gerar Planejamento" na barra lateral!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {posts.map(post => {
                  const isEditing = editingPostId === post.id;
                  const currentSubTab = cardSubTabs[post.id] || "feed";
                  
                  const bgGradient = post.dayOfWeek === 'Segunda-feira' 
                    ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' 
                    : post.dayOfWeek === 'Quarta-feira' 
                      ? 'linear-gradient(135deg, #6ee7b7 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #f3a7c4 0%, #db2777 100%)';

                  return (
                    <div 
                      key={post.id} 
                      className="card-modern" 
                      style={{ 
                        borderRadius: '16px', 
                        border: '1px solid #e2e8f0', 
                        background: '#fff', 
                        display: 'flex', 
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {/* Top banner of post card */}
                      <div style={{ background: bgGradient, padding: '12px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '4px' }}>
                            {post.dayOfWeek}
                          </span>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>
                            {isEditing ? (
                              <input 
                                type="text" 
                                value={editTitle} 
                                onChange={(e) => setEditTitle(e.target.value)} 
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderBottom: '1px solid #fff', outline: 'none', color: '#fff', width: '100%', fontSize: '0.95rem', fontWeight: '700', padding: '2px 4px' }}
                              />
                            ) : post.title}
                          </h4>
                        </div>
                        
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post.id, e.target.value)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            background: post.status === 'APPROVED' ? '#d1fae5' : (post.status === 'POSTED' ? '#dbeafe' : (post.status === 'ARCHIVED' ? '#fee2e2' : '#f1f5f9')),
                            color: post.status === 'APPROVED' ? '#065f46' : (post.status === 'POSTED' ? '#1e40af' : (post.status === 'ARCHIVED' ? '#991b1b' : '#475569'))
                          }}
                        >
                          <option value="DRAFT">Rascunho</option>
                          <option value="APPROVED">Aprovado</option>
                          <option value="POSTED">Publicado</option>
                          <option value="ARCHIVED">Arquivado</option>
                        </select>
                      </div>

                      {/* Content Section: side-by-side mockup and details */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', padding: '20px' }} className="md:grid-cols-12">
                        
                        {/* Column 1: Simulator Mockup */}
                        <div className="md:col-span-5 flex flex-col items-center gap-3">
                          {/* Inner Tabs switcher */}
                          <div style={{ display: 'flex', width: '100%', background: '#f1f5f9', padding: '3px', borderRadius: '8px', marginBottom: '4px' }}>
                            <button
                              onClick={() => setCardSubTabs(prev => ({ ...prev, [post.id]: "feed" }))}
                              style={{
                                flex: 1,
                                padding: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: currentSubTab === "feed" ? '#fff' : 'transparent',
                                color: currentSubTab === "feed" ? 'var(--primary)' : '#64748b',
                                boxShadow: currentSubTab === "feed" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                              }}
                            >
                              Feed Post
                            </button>
                            <button
                              onClick={() => setCardSubTabs(prev => ({ ...prev, [post.id]: "story" }))}
                              style={{
                                flex: 1,
                                padding: '6px',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: currentSubTab === "story" ? '#fff' : 'transparent',
                                color: currentSubTab === "story" ? 'var(--primary)' : '#64748b',
                                boxShadow: currentSubTab === "story" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                              }}
                            >
                              Story Post
                            </button>
                          </div>

                          {currentSubTab === "feed" ? (
                            /* Feed Mockup */
                            <div style={{ width: '100%', maxWidth: '300px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                              {/* Mock Header */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>K</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: '750', color: '#1e293b' }}>kinesis_clinica</span>
                                  <span style={{ fontSize: '0.55rem', color: '#64748b' }}>Clínica Kinesis</span>
                                </div>
                              </div>
                              
                              {/* Mock Image with paste support */}
                              {isEditing ? (
                                <div 
                                  onClick={() => document.getElementById(`edit-file-input-${post.id}`)?.click()}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith("image/")) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  onPaste={(e) => {
                                    const items = e.clipboardData.items;
                                    for (let i = 0; i < items.length; i++) {
                                      if (items[i].type.indexOf("image") !== -1) {
                                        const file = items[i].getAsFile();
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              setEditImageUrl(event.target.result as string);
                                              toast.success("Imagem colada!");
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                        e.preventDefault();
                                        break;
                                      }
                                    }
                                  }}
                                  tabIndex={0}
                                  title="Clique para carregar, ou selecione esta caixa e aperte Ctrl+V para colar uma imagem!"
                                  style={{ 
                                    width: '100%', 
                                    height: '260px', 
                                    background: editImageUrl ? `url(${editImageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    outline: 'none',
                                    border: '2px dashed var(--primary)'
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    color: '#fff',
                                    opacity: editImageUrl ? 0 : 1,
                                    transition: 'opacity 0.2s',
                                    zIndex: 5
                                  }}
                                  onMouseEnter={(e) => { if (editImageUrl) e.currentTarget.style.opacity = '1'; }}
                                  onMouseLeave={(e) => { if (editImageUrl) e.currentTarget.style.opacity = '0'; }}
                                  >
                                    <Plus size={20} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Colar (Ctrl+V) ou Clique para carregar</span>
                                  </div>
                                  <input 
                                    type="file" 
                                    id={`edit-file-input-${post.id}`} 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    style={{ display: 'none' }} 
                                  />
                                </div>
                              ) : (
                                <div style={{ 
                                  width: '100%', 
                                  height: '260px', 
                                  background: post.imageUrl ? `url(${post.imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary, #A31621) 0%, #1e293b 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative'
                                }}>
                                  {!post.imageUrl && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.75)' }}>
                                      <Sparkles size={24} />
                                      <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.08em' }}>KINESIS CLÍNICA</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Mock Actions */}
                              <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderBottom: '1px solid #f8fafc', color: '#475569' }}>
                                <Heart size={16} />
                                <MessageCircle size={16} />
                                <Share2 size={16} />
                              </div>
                              {/* Mock Description text short */}
                              <div style={{ padding: '8px 12px', fontSize: '0.65rem', color: '#475569', borderTop: '1px solid #f8fafc', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <strong>kinesis_clinica</strong> {post.content.substring(0, 100)}...
                              </div>
                            </div>
                          ) : (
                            /* Story Mockup (Vertical mobile screen) */
                            <div style={{
                              width: '200px',
                              height: '356px',
                              borderRadius: '16px',
                              border: '6px solid #1e293b',
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              background: isEditing 
                                ? (editImageUrl ? `url(${editImageUrl}) center/cover no-repeat` : bgGradient)
                                : (post.imageUrl ? `url(${post.imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary, #A31621) 0%, #1e293b 100%)'),
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '12px'
                            }}>
                              {/* Drag and drop for Story when editing */}
                              {isEditing && (
                                <>
                                <div 
                                  onClick={() => document.getElementById(`edit-story-file-input-${post.id}`)?.click()}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith("image/")) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  onPaste={(e) => {
                                    const items = e.clipboardData.items;
                                    for (let i = 0; i < items.length; i++) {
                                      if (items[i].type.indexOf("image") !== -1) {
                                        const file = items[i].getAsFile();
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              setEditImageUrl(event.target.result as string);
                                              toast.success("Imagem colada!");
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                        e.preventDefault();
                                        break;
                                      }
                                    }
                                  }}
                                  tabIndex={0}
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    opacity: editImageUrl ? 0 : 1,
                                    zIndex: 5,
                                    textAlign: 'center',
                                    padding: '10px'
                                  }}
                                  onMouseEnter={(e) => { if (editImageUrl) e.currentTarget.style.opacity = '1'; }}
                                  onMouseLeave={(e) => { if (editImageUrl) e.currentTarget.style.opacity = '0'; }}
                                >
                                  <Plus size={16} />
                                  <span style={{ fontSize: '0.55rem', fontWeight: 'bold' }}>Colar (Ctrl+V) ou Carregar Imagem</span>
                                </div>
                                <input 
                                  type="file" 
                                  id={`edit-story-file-input-${post.id}`} 
                                  accept="image/*" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  style={{ display: 'none' }} 
                                />
                                </>
                              )}
                              
                              {/* Story indicators */}
                              <div style={{ position: 'absolute', top: '4px', left: '6px', right: '6px', display: 'flex', gap: '2px' }}>
                                <div style={{ flex: 1, height: '2px', background: '#fff', borderRadius: '1px' }}></div>
                                <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.4)', borderRadius: '1px' }}></div>
                              </div>
                              {/* Header info */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', zIndex: 2 }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.45rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>K</div>
                                <span style={{ fontSize: '0.55rem', fontWeight: '750', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>kinesis_clinica</span>
                              </div>
                              {/* Center Content overlay text */}
                              <div style={{
                                background: 'rgba(0,0,0,0.55)',
                                color: '#fff',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                margin: '0 8px',
                                zIndex: 2,
                                whiteSpace: 'pre-wrap'
                              }}>
                                {isEditing ? editStoryContent : (post.storyContent ? post.storyContent.substring(0, 180) + "..." : "Carregando sugestão...")}
                              </div>
                              {/* Sticker Mockup */}
                              <div style={{ display: 'flex', justifyContent: 'center', zIndex: 2 }}>
                                <div style={{
                                  background: '#fff',
                                  borderRadius: '8px',
                                  padding: '6px',
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                                  textAlign: 'center',
                                  width: '100px'
                                }}>
                                  <div style={{ fontSize: '0.45rem', fontWeight: '800', color: '#64748b', marginBottom: '3px' }}>ENQUETE</div>
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    <div style={{ flex: 1, padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.45rem', fontWeight: '700', color: '#334155' }}>Sim!</div>
                                    <div style={{ flex: 1, padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.45rem', fontWeight: '700', color: '#334155' }}>Não</div>
                                  </div>
                                </div>
                              </div>
                              {/* Empty space for bottom spacer */}
                              <div></div>
                            </div>
                          )}
                          
                          {/* Image generation/action */}
                        </div>

                        {/* Column 2: Text details and edits */}
                        <div className="md:col-span-7 flex flex-col gap-4">
                          {/* Theme source topic */}
                          {post.sourceTopic && (
                            <div style={{ display: 'flex', gap: '6px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', color: '#64748b', border: '1px solid #f1f5f9' }}>
                              <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                              <span><strong>Fonte do Tema:</strong> {post.sourceTopic}</span>
                            </div>
                          )}

                          {currentSubTab === "feed" ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>LEGENDA DO FEED</label>
                                {!isEditing && (
                                  <button 
                                    onClick={() => handleCopyToClipboard(post.content, "Texto da legenda")} 
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '700' }}
                                  >
                                    <Copy size={12} /> Copiar Feed
                                  </button>
                                )}
                              </div>
                              {isEditing ? (
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  style={{ width: '100%', minHeight: '130px', padding: '8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical', outline: 'none' }}
                                />
                              ) : (
                                <div style={{ maxHeight: '160px', overflowY: 'auto', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                  {post.content}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>LEGENDA DO STORY</label>
                                {!isEditing && (
                                  <button 
                                    onClick={() => handleCopyToClipboard(post.storyContent || "", "Texto do story")} 
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '700' }}
                                  >
                                    <Copy size={12} /> Copiar Story
                                  </button>
                                )}
                              </div>
                              {isEditing ? (
                                <textarea
                                  value={editStoryContent}
                                  onChange={(e) => setEditStoryContent(e.target.value)}
                                  style={{ width: '100%', minHeight: '130px', padding: '8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical', outline: 'none' }}
                                />
                              ) : (
                                <div style={{ maxHeight: '160px', overflowY: 'auto', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                  {post.storyContent || "Nenhuma sugestão de story gerada para este post."}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Image Prompt details */}
                          <div style={{
                             background: '#eff6ff',
                             border: '1px solid #bfdbfe',
                             borderRadius: '10px',
                             padding: '12px 14px',
                             marginTop: '8px',
                             boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
                           }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                   <Sparkles size={14} color="#1d4ed8" />
                                   Prompt para Gemini Web (Grátis)
                                 </span>
                                 <span style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '1px' }}>
                                   Gere gratuitamente no <strong>gemini.google.com</strong> e cole a imagem aqui (Ctrl+V)
                                 </span>
                               </div>
                               {!isEditing && (
                                 <button 
                                   onClick={() => handleCopyToClipboard(post.imagePrompt, "Prompt da imagem")} 
                                   style={{ 
                                     background: 'var(--primary, #A31621)', 
                                     color: '#fff',
                                     border: 'none', 
                                     padding: '4px 10px',
                                     borderRadius: '6px',
                                     cursor: 'pointer', 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     gap: '6px', 
                                     fontSize: '0.7rem', 
                                     fontWeight: '700',
                                     boxShadow: '0 2px 4px rgba(163, 22, 33, 0.2)',
                                     transition: 'all 0.15s',
                                     flexShrink: 0
                                   }}
                                 >
                                   <Copy size={12} /> Copiar Prompt
                                 </button>
                               )}
                             </div>
                             {isEditing ? (
                               <textarea
                                 value={editImagePrompt}
                                 onChange={(e) => setEditImagePrompt(e.target.value)}
                                 style={{ width: '100%', minHeight: '60px', padding: '8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical', outline: 'none', background: '#fff' }}
                               />
                             ) : (
                               <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontStyle: 'italic', lineHeight: '1.4' }}>
                                 "{post.imagePrompt}"
                               </div>
                             )}
                           </div>
                        </div>

                      </div>

                      {/* Footer Actions */}
                      <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                            <button onClick={saveEdits} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
                              <Check size={14} /> Salvar Alterações
                            </button>
                            <button onClick={() => setEditingPostId(null)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEdit(post)}
                              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}
                            >
                              <Edit3 size={14} /> Editar
                            </button>
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700' }}
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "stories" ? (
        /* Stories Creator Studio Tab (Instagram Visual Simulator) */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-12">
          {/* Left panel: Creator Input and suggestions */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="card-modern" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                <Smartphone size={18} color="var(--primary)" />
                Gerador de Stories
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Theme input */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Tema do Story</label>
                  <input
                    type="text"
                    placeholder="Ex: Alongamento lombar em gestantes..."
                    value={storyTheme}
                    onChange={(e) => setStoryTheme(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Predefined chips */}
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Sugestões rápidas</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {storySuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => setStoryTheme(sug)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#475569',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone of voice & Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Tom de Voz</label>
                    <select
                      value={storyTone}
                      onChange={(e) => setStoryTone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        outline: 'none',
                        cursor: 'pointer',
                        background: '#fff'
                      }}
                    >
                      <option value="Educativo">Educativo</option>
                      <option value="Comercial/Vendas">Vendas</option>
                      <option value="Engajamento">Engajamento</option>
                      <option value="Acolhedor/Empático">Acolhedor</option>
                      <option value="Descontraído">Descontraído</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Qtd. de Telas</label>
                    <select
                      value={storyQuantity}
                      onChange={(e) => setStoryQuantity(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        outline: 'none',
                        cursor: 'pointer',
                        background: '#fff'
                      }}
                    >
                      <option value={3}>3 Slides</option>
                      <option value={4}>4 Slides</option>
                      <option value={5}>5 Slides</option>
                    </select>
                  </div>
                </div>

                {/* Button to generate */}
                <button
                  onClick={handleGenerateStories}
                  disabled={storyGenerating}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  {storyGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {storyGenerating ? "Escrevendo Stories..." : "Gerar Roteiro de Stories"}
                </button>
              </div>
            </div>
            
            {storyList.length > 0 && (
              <div className="card-modern" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginTop: 0, marginBottom: '8px' }}>Roteiro Completo</h4>
                <button 
                  onClick={copyAllStoriesText}
                  className="btn-secondary" 
                  style={{ width: '100%', padding: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Copy size={12} /> Copiar Toda a Sequência
                </button>
              </div>
            )}
          </div>

          {/* Right panel: Premium visual simulator */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {storyGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                <p style={{ marginTop: '16px', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>Gerando sequência de slides criativa...</p>
                <p style={{ marginTop: '4px', color: '#64748b', fontSize: '0.8rem' }}>Estruturando ganchos, enquetes e prompts...</p>
              </div>
            ) : storyList.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#fff' }}>
                <Smartphone size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#475569', margin: 0 }}>Nenhuma sequência gerada ainda.</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0 auto' }}>
                  Escreva um tema novo ou clique em um dos temas sugeridos ao lado para criar um roteiro de stories interativo com IA!
                </p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                {/* Visual simulator header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Simulador de Stories Kinesis</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>Tema: "{storyTheme}"</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {storyList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveStoryPreviewIndex(idx)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: activeStoryPreviewIndex === idx ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                          background: activeStoryPreviewIndex === idx ? 'var(--primary)' : '#fff',
                          color: activeStoryPreviewIndex === idx ? '#fff' : '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active story simulator */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="md:grid-cols-12">
                  {/* Phone Simulator block */}
                  <div className="md:col-span-5 flex justify-center">
                    <div style={{
                      width: '240px',
                      height: '426px',
                      borderRadius: '24px',
                      border: '8px solid #0f172a',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                      background: storyList[activeStoryPreviewIndex].imageUrl 
                        ? `url(${storyList[activeStoryPreviewIndex].imageUrl}) center/cover no-repeat` 
                        : 'linear-gradient(135deg, var(--primary, #A31621) 0%, #1e293b 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '14px',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Top status progress bar */}
                      <div style={{ position: 'absolute', top: '5px', left: '8px', right: '8px', display: 'flex', gap: '3px', zIndex: 10 }}>
                        {storyList.map((_, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              flex: 1, 
                              height: '2px', 
                              background: idx === activeStoryPreviewIndex 
                                ? '#fff' 
                                : (idx < activeStoryPreviewIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)'), 
                              borderRadius: '1px' 
                            }}
                          ></div>
                        ))}
                      </div>

                      {/* User Top info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', zIndex: 5 }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.55rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>K</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>kinesis_clinica</span>
                          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Patrocinado</span>
                        </div>
                      </div>

                      {/* Text box overlay */}
                      <div style={{ zIndex: 5, padding: '0 4px' }}>
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          lineHeight: '1.4',
                          textAlign: 'center',
                          whiteSpace: 'pre-wrap',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {storyList[activeStoryPreviewIndex].text}
                        </div>
                      </div>

                      {/* Interactive Sticker Block */}
                      {storyList[activeStoryPreviewIndex].sticker && storyList[activeStoryPreviewIndex].sticker?.type !== "none" && (
                        <div style={{ display: 'flex', justifyContent: 'center', zIndex: 5, margin: '8px 0' }}>
                          {storyList[activeStoryPreviewIndex].sticker?.type === "poll" && (
                            /* Enquete Sticker */
                            <div style={{
                              background: '#fff',
                              borderRadius: '12px',
                              padding: '8px 10px',
                              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                              textAlign: 'center',
                              width: '150px'
                            }}>
                              <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                                {storyList[activeStoryPreviewIndex].sticker?.question}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {storyList[activeStoryPreviewIndex].sticker?.options?.map((opt, oIdx) => {
                                  const wasVoted = votedPollSticker[activeStoryPreviewIndex] === opt;
                                  const hasVotedAny = votedPollSticker[activeStoryPreviewIndex] !== undefined;
                                  
                                  // Mock values for vote shares
                                  const votePct = oIdx === 0 ? "76%" : "24%";
                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => setVotedPollSticker(prev => ({ ...prev, [activeStoryPreviewIndex]: opt }))}
                                      style={{
                                        padding: '5px 8px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontSize: '0.6rem',
                                        fontWeight: '750',
                                        cursor: 'pointer',
                                        background: wasVoted ? 'var(--primary-light, #eff6ff)' : '#fff',
                                        color: wasVoted ? 'var(--primary)' : '#334155',
                                        borderColor: wasVoted ? 'var(--primary)' : '#e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {hasVotedAny && (
                                        <div style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          bottom: 0,
                                          width: oIdx === 0 ? '76%' : '24%',
                                          background: wasVoted ? 'rgba(99, 102, 241, 0.15)' : 'rgba(100, 116, 139, 0.08)',
                                          zIndex: 1
                                        }}></div>
                                      )}
                                      <span style={{ zIndex: 2 }}>{opt}</span>
                                      {hasVotedAny && <span style={{ fontSize: '0.55rem', fontWeight: '800', zIndex: 2 }}>{votePct}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {storyList[activeStoryPreviewIndex].sticker?.type === "question" && (
                            /* Caixinha de Perguntas Sticker */
                            <div style={{
                              background: 'linear-gradient(135deg, #ff007f 0%, #7f00ff 100%)',
                              borderRadius: '12px',
                              padding: '8px',
                              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                              textAlign: 'center',
                              width: '150px',
                              color: '#fff'
                            }}>
                              <div style={{ fontSize: '0.55rem', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>
                                {storyList[activeStoryPreviewIndex].sticker?.question}
                              </div>
                              <div style={{ 
                                background: '#fff', 
                                borderRadius: '8px', 
                                padding: '6px 8px', 
                                color: '#94a3b8', 
                                fontSize: '0.55rem', 
                                textAlign: 'left',
                                cursor: 'text'
                              }}>
                                Escreva uma resposta...
                              </div>
                            </div>
                          )}

                          {storyList[activeStoryPreviewIndex].sticker?.type === "slider" && (
                            /* Emoji Slider Sticker */
                            <div style={{
                              background: '#fff',
                              borderRadius: '12px',
                              padding: '8px 10px',
                              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                              textAlign: 'center',
                              width: '150px'
                            }}>
                              <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                                {storyList[activeStoryPreviewIndex].sticker?.question}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px', position: 'relative' }}>
                                  <div style={{ position: 'absolute', top: '-6px', left: '70%', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', cursor: 'grab' }}>🔥</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom placeholder */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', zIndex: 5 }}>
                        <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.7)', borderRadius: '14px', padding: '4px 8px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', background: 'rgba(0,0,0,0.1)' }}>
                          Enviar mensagem...
                        </div>
                        <Send size={12} color="#fff" />
                      </div>
                    </div>
                  </div>

                  {/* Controls / Story Slide description */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        Slide {activeStoryPreviewIndex + 1} de {storyList.length}
                      </span>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <button
                          onClick={() => copyToClipboardDirect(storyList[activeStoryPreviewIndex].text, `Texto do Slide ${activeStoryPreviewIndex + 1}`)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}
                        >
                          <Copy size={12} /> Copiar slide
                        </button>
                        <button
                          onClick={() => exportStoryAsImage(storyList[activeStoryPreviewIndex])}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}
                        >
                          <Download size={12} /> Exportar Imagem
                        </button>
                      </div>
                    </div>

                    {/* Text editor/display */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '4px' }}>CONTEÚDO TEXTUAL</label>
                      {editingStoryIndex === activeStoryPreviewIndex ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            value={editStoryText}
                            onChange={(e) => setEditStoryText(e.target.value)}
                            style={{ width: '100%', minHeight: '100px', padding: '8px', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => saveEditStory(activeStoryPreviewIndex)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Salvar</button>
                            <button onClick={() => setEditingStoryIndex(null)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                            {storyList[activeStoryPreviewIndex].text}
                          </div>
                          <button 
                            onClick={() => startEditStory(activeStoryPreviewIndex)}
                            className="btn-secondary"
                            style={{ width: 'fit-content', padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit3 size={12} /> Editar Roteiro
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Visual Prompt details */}
                    <div style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginTop: '8px',
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={14} color="#1d4ed8" />
                            Prompt para Gemini Web (Grátis)
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '1px' }}>
                            Gere gratuitamente no <strong>gemini.google.com</strong> e cole a imagem aqui (Ctrl+V)
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboardDirect(storyList[activeStoryPreviewIndex].visualPrompt, "Prompt visual")}
                          style={{ 
                            background: 'var(--primary, #A31621)', 
                            color: '#fff',
                            border: 'none', 
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            fontSize: '0.7rem', 
                            fontWeight: '700',
                            boxShadow: '0 2px 4px rgba(163, 22, 33, 0.2)',
                            transition: 'all 0.15s',
                            flexShrink: 0
                          }}
                        >
                          <Copy size={12} /> Copiar Prompt
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{storyList[activeStoryPreviewIndex].visualPrompt}"
                      </div>
                    </div>

                    {/* Image generation state info */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {storyList[activeStoryPreviewIndex].imageUrl 
                          ? "✓ Foto vertical integrada ao layout." 
                          : "⚠ Aguardando geração da imagem vertical."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Archived Tab UI */
        <>
          {loadingArchived ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px' }}>
              <Loader2 className="animate-spin" size={36} color="var(--primary)" />
              <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>Carregando postagens arquivadas...</p>
            </div>
          ) : archivedPosts.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#fff' }}>
              <Archive size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#475569', margin: 0 }}>Nenhuma postagem arquivada.</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Você pode arquivar postagens alterando o status delas para \"Arquivado\".</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
              {archivedPosts.map(post => {
                const isEditing = editingPostId === post.id;
                const currentSubTab = cardSubTabs[post.id] || "feed";
                const bgGradient = 'linear-gradient(135deg, #64748b 0%, #334155 100%)';

                return (
                  <div 
                    key={post.id} 
                    className="card-modern" 
                    style={{ 
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0', 
                      background: '#fff', 
                      display: 'flex', 
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Header banner */}
                    <div style={{ background: bgGradient, padding: '12px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '4px' }}>
                          Arquivada • {post.dayOfWeek}
                        </span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editTitle} 
                              onChange={(e) => setEditTitle(e.target.value)} 
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderBottom: '1px solid #fff', outline: 'none', color: '#fff', width: '100%', fontSize: '0.95rem', fontWeight: '700', padding: '2px 4px' }}
                            />
                          ) : post.title}
                        </h4>
                      </div>
                      
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}
                      >
                        <option value="DRAFT">Restaurar (Rascunho)</option>
                        <option value="APPROVED">Restaurar (Aprovado)</option>
                        <option value="POSTED">Restaurar (Publicado)</option>
                        <option value="ARCHIVED">Arquivado</option>
                      </select>
                    </div>

                    {/* Content Section: side-by-side mockup and details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', padding: '20px' }} className="md:grid-cols-12">
                      {/* Column 1: Simulator Mockup */}
                      <div className="md:col-span-5 flex flex-col items-center gap-3">
                        {/* Inner Tabs switcher */}
                        <div style={{ display: 'flex', width: '100%', background: '#f1f5f9', padding: '3px', borderRadius: '8px', marginBottom: '4px' }}>
                          <button
                            onClick={() => setCardSubTabs(prev => ({ ...prev, [post.id]: "feed" }))}
                            style={{
                              flex: 1,
                              padding: '6px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: currentSubTab === "feed" ? '#fff' : 'transparent',
                              color: currentSubTab === "feed" ? 'var(--primary)' : '#64748b',
                              boxShadow: currentSubTab === "feed" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            Feed Post
                          </button>
                          <button
                            onClick={() => setCardSubTabs(prev => ({ ...prev, [post.id]: "story" }))}
                            style={{
                              flex: 1,
                              padding: '6px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              background: currentSubTab === "story" ? '#fff' : 'transparent',
                              color: currentSubTab === "story" ? 'var(--primary)' : '#64748b',
                              boxShadow: currentSubTab === "story" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            Story Post
                          </button>
                        </div>

                        {currentSubTab === "feed" ? (
                          /* Feed Mockup */
                          <div style={{ width: '100%', maxWidth: '300px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff', opacity: 0.7 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#64748b', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>K</div>
                              <span style={{ fontSize: '0.7rem', fontWeight: '750', color: '#1e293b' }}>kinesis_clinica</span>
                            </div>
                            <div style={{ 
                              width: '100%', 
                              height: '220px', 
                              background: isEditing 
                                ? (editImageUrl ? `url(${editImageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #64748b 0%, #334155 100%)')
                                : (post.imageUrl ? `url(${post.imageUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #64748b 0%, #334155 100%)')
                            }}>
                              {/* Edit mockup paster for Archived posts */}
                              {isEditing && (
                                <div 
                                  onClick={() => document.getElementById(`edit-archived-file-input-${post.id}`)?.click()}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith("image/")) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  onPaste={(e) => {
                                    const items = e.clipboardData.items;
                                    for (let i = 0; i < items.length; i++) {
                                      if (items[i].type.indexOf("image") !== -1) {
                                        const file = items[i].getAsFile();
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              setEditImageUrl(event.target.result as string);
                                              toast.success("Imagem colada!");
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                        e.preventDefault();
                                        break;
                                      }
                                    }
                                  }}
                                  tabIndex={0}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Colar (Ctrl+V) ou Carregar
                                  <input 
                                    type="file" 
                                    id={`edit-archived-file-input-${post.id}`} 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    style={{ display: 'none' }} 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Story Mockup */
                          <div style={{
                            width: '180px',
                            height: '320px',
                            borderRadius: '12px',
                            border: '4px solid #475569',
                            background: isEditing 
                              ? (editImageUrl ? `url(${editImageUrl}) center/cover no-repeat` : bgGradient)
                              : (post.imageUrl ? `url(${post.imageUrl}) center/cover no-repeat` : bgGradient),
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '10px',
                            opacity: 0.7,
                            position: 'relative'
                          }}>
                            {isEditing && (
                              <>
                              <div 
                                onClick={() => document.getElementById(`edit-archived-story-file-input-${post.id}`)?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files?.[0];
                                  if (file && file.type.startsWith("image/")) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                onPaste={(e) => {
                                  const items = e.clipboardData.items;
                                  for (let i = 0; i < items.length; i++) {
                                    if (items[i].type.indexOf("image") !== -1) {
                                      const file = items[i].getAsFile();
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            setEditImageUrl(event.target.result as string);
                                            toast.success("Imagem colada!");
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                      e.preventDefault();
                                      break;
                                    }
                                  }
                                }}
                                tabIndex={0}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                Colar ou Carregar
                              </div>
                              <input 
                                type="file" 
                                id={`edit-archived-story-file-input-${post.id}`} 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ display: 'none' }} 
                              />
                              </>
                            )}
                            <div></div>
                            <div style={{
                              background: 'rgba(0,0,0,0.6)',
                              color: '#fff',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.55rem',
                              textAlign: 'center'
                            }}>
                              {isEditing ? editStoryContent : (post.storyContent || "Nenhuma sugestão...")}
                            </div>
                            <div></div>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Details */}
                      <div className="md:col-span-7 flex flex-col gap-4">
                        {currentSubTab === "feed" ? (
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>LEGENDA DO FEED</label>
                            {isEditing ? (
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                style={{ width: '100%', minHeight: '100px', padding: '8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                              />
                            ) : (
                              <div style={{ maxHeight: '120px', overflowY: 'auto', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                                {post.content}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>LEGENDA DO STORY</label>
                            {isEditing ? (
                              <textarea
                                value={editStoryContent}
                                onChange={(e) => setEditStoryContent(e.target.value)}
                                style={{ width: '100%', minHeight: '100px', padding: '8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
                              />
                            ) : (
                              <div style={{ maxHeight: '120px', overflowY: 'auto', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                                {post.storyContent}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', background: '#fafafa' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <button onClick={saveEdits} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}>Salvar</button>
                          <button onClick={() => setEditingPostId(null)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}>Cancelar</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => startEdit(post)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>Editar</button>
                          <button onClick={() => handleDeletePost(post.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>Excluir</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Botão Flutuante do Marketing IA */}
      <button
        onClick={() => setShowAIChat(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(219, 39, 119, 0.3)',
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

      {/* Drawer do Marketing IA */}
      {showAIChat && (
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
          {/* Backdrop Click */}
          <div 
            onClick={() => setShowAIChat(false)} 
            style={{ position: 'absolute', inset: 0 }}
          />

          <div style={{
            position: 'relative',
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
            borderLeft: '1px solid #cbd5e1',
            zIndex: 10000
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f8fafc 0%, #fdf2f8 100%)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Megaphone size={18} style={{ color: '#db2777' }} />
                  Kinesis Marketing IA
                </h3>
                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', margin: '2px 0 0 0' }}>Consultor Virtual de Redes Sociais</p>
              </div>
              <button 
                onClick={() => setShowAIChat(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages Panel */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.map((msg, idx) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      lineHeight: '1.5',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      whiteSpace: 'pre-wrap',
                      background: isAssistant ? '#fff' : '#db2777',
                      color: isAssistant ? '#334155' : '#fff',
                      border: isAssistant ? '1px solid #e2e8f0' : 'none',
                      borderTopLeftRadius: isAssistant ? '0px' : '12px',
                      borderTopRightRadius: isAssistant ? '12px' : '0px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Imagem anexada" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '180px', 
                            borderRadius: '6px', 
                            objectFit: 'contain',
                            border: isAssistant ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)' 
                          }} 
                        />
                      )}
                      {msg.content && <div>{msg.content}</div>}
                    </div>
                  </div>
                );
              })}
              
              {chatLoading && (
                <div style={{ display: 'flex', justifySelf: 'flex-start', width: '100%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem'
                  }}>
                    <Loader2 className="animate-spin" size={12} />
                    Digitando...
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Quick Suggestion Chips */}
            <div style={{ padding: '8px 16px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '6px', scrollbarWidth: 'none' }}>
              {[
                "Sugerir temas de Pilates para idosos",
                "Ideias de post para ombro",
                "Como estruturar post no IG?",
                "Ideias sobre Fibromialgia"
              ].map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChatMessage(sug)}
                  disabled={chatLoading}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fdf2f8';
                    e.currentTarget.style.borderColor = '#db2777';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Attached image preview */}
            {chatAttachedImage && (
              <div style={{ padding: '8px 16px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img src={chatAttachedImage} alt="Anexo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => setChatAttachedImage(null)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.5rem'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Foto anexada para envio</span>
              </div>
            )}

            {/* Chat Input Bar */}
            <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => document.getElementById('chat-file-input')?.click()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#db2777'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                title="Anexar Imagem"
              >
                <Plus size={16} />
                <input 
                  type="file" 
                  id="chat-file-input" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setChatAttachedImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }} 
                />
              </button>
              <input
                type="text"
                placeholder="Dúvida ou Ctrl+V para imagem..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPaste={(e) => {
                  const items = e.clipboardData.items;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                      const file = items[i].getAsFile();
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setChatAttachedImage(event.target.result as string);
                            toast.success("Imagem colada!");
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                      e.preventDefault();
                      break;
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !chatLoading) handleSendChatMessage();
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleSendChatMessage()}
                disabled={chatLoading || (!chatInput.trim() && !chatAttachedImage)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: (chatInput.trim() || chatAttachedImage) ? '#db2777' : '#cbd5e1',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (chatInput.trim() || chatAttachedImage) && !chatLoading ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
