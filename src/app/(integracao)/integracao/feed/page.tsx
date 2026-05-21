"use client";

import { PlayCircle, Info, HeartPulse, Share2, Bookmark, Star, Cake } from "lucide-react";
import { useState, useEffect } from "react";

export default function IntegracaoFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([
    {
      id: 1,
      type: "video",
      category: "Dica de Especialista",
      title: "Exercícios simples para aliviar a tensão nos ombros",
      description: "Aprenda 3 movimentos práticos que você pode fazer na cadeira do escritório ou em casa para relaxar a cervical.",
      thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800",
      date: "Hoje",
      icon: <PlayCircle size={20} className="text-purple-600" />
    },
    {
      id: 2,
      type: "article",
      category: "Bem-estar",
      title: "A importância do sono na recuperação muscular",
      description: "Durante o sono profundo, o corpo libera hormônios essenciais para o reparo dos tecidos. Uma boa noite de descanso é o melhor remédio complementar à fisioterapia. Tente manter uma rotina de horários e evite telas 1 hora antes de deitar.",
      thumbnail: null,
      date: "Ontem",
      icon: <HeartPulse size={20} className="text-teal-600" />
    },
    {
      id: 3,
      type: "news",
      category: "Novidade Kinesis",
      title: "Novas turmas de Pilates para o próximo mês",
      description: "Estamos abrindo novos horários nas terças e quintas-feiras de manhã. As vagas são limitadas! Converse com a nossa recepção para saber mais.",
      thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800",
      date: "Semana passada",
      icon: <Info size={20} className="text-blue-600" />
    }
  ]);

  useEffect(() => {
    try {
      const dynamicTips = localStorage.getItem('kinesis_integration_feed_dynamic');
      if (dynamicTips) {
        const parsed = JSON.parse(dynamicTips);
        const newTips = parsed.map((item: any, idx: number) => {
          const isVideo = item.link && item.link.includes('youtube');
          const isBirthday = item.type === 'parabens';
          
          let currentThumbnail = null;
          if (isVideo) currentThumbnail = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800';
          else if (item.link) currentThumbnail = item.link; // Use raw link as image directly if not video

          return {
            id: 100 + idx,
            type: isBirthday ? "parabens" : (isVideo ? "video" : "article"),
            category: isBirthday ? "Parabéns pra Você!" : "Dica do Profissional",
            title: item.title,
            description: item.message,
            thumbnail: currentThumbnail,
            date: new Date(item.date).toLocaleDateString(),
            icon: isBirthday ? <Cake size={20} className="text-amber-600" /> : <Star size={20} className="text-emerald-500" />,
            customLink: item.link
          };
        });
        
        // Prepend new tips
        setFeedItems(prev => [...newTips, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold text-slate-800">Seu Feed Kinesis</h2>
        <p className="text-slate-500 mt-2 text-lg">Conteúdos selecionados especialmente para você.</p>
      </div>

      <div className="flex flex-col gap-6">
        {feedItems.map((item) => (
          <article 
            key={item.id} 
            className={`rounded-3xl overflow-hidden shadow-sm border flex flex-col transition-all hover:shadow-md ${
              item.type === 'parabens' 
                ? 'bg-gradient-to-b from-amber-50 via-white to-amber-50/50 border-amber-200 shadow-amber-100 ring-4 ring-amber-100/30' 
                : 'bg-white border-slate-100'
            }`}
          >
            
            {/* Visual Header (Video/Image) */}
            {item.thumbnail && (
              <div className="relative h-56 w-full bg-slate-200">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                {item.type === 'video' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                      <PlayCircle size={40} className="text-white ml-2" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                {item.icon}
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">{item.category}</span>
                <span className="text-sm text-slate-400 ml-auto">{item.date}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-3 leading-tight">{item.title}</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">{item.description}</p>
              
              {/* Footer Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <button className="flex items-center gap-2 text-slate-500 hover:text-purple-600 font-medium transition-colors">
                  <Bookmark size={20} />
                  Salvar
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-teal-600 font-medium transition-colors">
                  <Share2 size={20} />
                  Compartilhar
                </button>
                
                {item.type === 'video' && (
                  <button 
                    className="ml-auto bg-[#D8BFD8]/30 hover:bg-[#D8BFD8]/50 text-purple-800 px-6 py-2 rounded-xl font-bold transition-colors"
                    onClick={() => item.customLink ? window.open(item.customLink, '_blank') : null}
                  >
                    Assistir
                  </button>
                )}
                {item.type === 'article' && (
                  <button className="ml-auto bg-[#AFEEEE]/30 hover:bg-[#AFEEEE]/50 text-teal-800 px-6 py-2 rounded-xl font-bold transition-colors">
                    Ler Completo
                  </button>
                )}
              </div>
            </div>
            
          </article>
        ))}
      </div>
      
      <div className="text-center py-6">
        <p className="text-slate-400 font-medium">Você chegou ao fim das novidades de hoje! ✨</p>
      </div>
    </div>
  );
}
