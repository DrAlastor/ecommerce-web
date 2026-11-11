import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type { AiChatMessage, QbeQueryPayload } from '../types/reports.types';

interface ReportsAiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQueryPayload?: (payload: QbeQueryPayload) => void;
}

export const ReportsAiChatDrawer: React.FC<ReportsAiChatDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola. Soy tu consultor de inteligencia de negocios para Dressly. Puedes preguntarme sobre ventas, existencias, rendimiento de sucursales o pedirme reportes específicos por texto o dictado de voz.',
      timestamp: 'Ahora',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isSending) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);
    setVoiceNotice(null);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await reportsService.sendAiChat({
        message: text,
        history: historyPayload,
      });

      const assistantMsg: AiChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        keyMetrics: res.keyMetrics,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error al enviar mensaje a IA:', err);
      const errorMsg: AiChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'No pude procesar la consulta en este momento. Por favor verifica la conexión o intenta formular la pregunta de otra manera.',
        timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleVoice = () => {
    setVoiceNotice(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Tu navegador no cuenta con soporte nativo de Web Speech API.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const userLang = navigator.language || 'es-419';
      recognition.lang = userLang.startsWith('es') ? userLang : 'es-419';
      recognition.continuous = false;
      recognition.interimResults = true;

      let transcript = '';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Escuchando tu voz... Habla ahora.');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const textSoFar = (transcript + ' ' + interim).trim();
        if (textSoFar) {
          setInputText(textSoFar);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'network') {
          setVoiceNotice('Error de red en el servicio de voz (en Brave activa los servicios de voz de Google).');
        } else if (event.error === 'not-allowed') {
          setVoiceNotice('Permiso de micrófono bloqueado en el navegador.');
        } else if (event.error !== 'aborted') {
          setVoiceNotice(`Aviso de voz: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceNotice(null);
        if (transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error al iniciar voz en chat:', err);
      setIsListening(false);
      setVoiceNotice('No se pudo activar el micrófono.');
    }
  };

  const quickPrompts = [
    'Ventas acumuladas de este mes por sucursal',
    'Prendas con inventario bajo en tiendas',
    'Clientes con mayor cantidad de compras',
    'Rendimiento comercial entre sucursales',
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(28, 21, 16, 0.6)',
        transition: 'all 0.25s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '470px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Drawer */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #EAE6DF',
            backgroundColor: '#FAF8F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            boxSizing: 'border-box',
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                backgroundColor: '#1C1510',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} color="#C4956A" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1C1510' }}>
                  Asistente Analítico IA
                </h3>
                <span
                  style={{
                    backgroundColor: '#E8F5E9',
                    color: '#2E7D32',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Gemini 3.5 Flash Lite
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#736B63', overflowWrap: 'anywhere' }}>
                Reportes explicados por voz o chat con Inteligencia Artificial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#736B63',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              flexShrink: 0,
            }}
            aria-label="Cerrar chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notificación de Voz si existe */}
        {voiceNotice && (
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontSize: '0.78rem',
              borderBottom: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{voiceNotice}</span>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Lista de Mensajes */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#FCFBFA',
            boxSizing: 'border-box',
            width: '100%',
            minWidth: 0,
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  maxWidth: '92%',
                  minWidth: 0,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: msg.role === 'user' ? '#8C5E35' : '#1C1510',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>

                <div
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1C1510' : '#FFFFFF',
                    color: msg.role === 'user' ? '#FFFFFF' : '#1C1510',
                    padding: '0.85rem 1rem',
                    borderRadius:
                      msg.role === 'user'
                        ? '12px 12px 2px 12px'
                        : '12px 12px 12px 2px',
                    border: msg.role === 'user' ? 'none' : '1px solid #EAE6DF',
                    fontSize: '0.86rem',
                    lineHeight: '1.55',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    overflowX: 'hidden',
                  }}
                >
                  <div
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      minWidth: 0,
                      maxWidth: '100%',
                      lineHeight: '1.6',
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Tarjetas de Métricas consolidadas del reporte */}
                  {msg.keyMetrics && msg.keyMetrics.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.45rem',
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: msg.role === 'user' ? '1px solid rgba(255,255,255,0.15)' : '1px solid #F0ECE4',
                        minWidth: 0,
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {msg.keyMetrics.map((kpi, kIdx) => (
                        <div
                          key={kIdx}
                          style={{
                            minWidth: 0,
                            maxWidth: '100%',
                            backgroundColor: msg.role === 'user' ? '#2A2018' : '#FAF8F5',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '6px',
                            border: msg.role === 'user' ? '1px solid #3E3125' : '1px solid #EAE6DF',
                            boxSizing: 'border-box',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: msg.role === 'user' ? '#C4956A' : '#736B63',
                              fontWeight: 600,
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                            }}
                          >
                            {kpi.label}
                          </div>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: msg.role === 'user' ? '#FFFFFF' : '#1C1510',
                              marginTop: '0.15rem',
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                            }}
                          >
                            {kpi.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#A0988E',
                  marginTop: '0.25rem',
                  padding: msg.role === 'user' ? '0 0.5rem 0 0' : '0 0 0 2rem',
                }}
              >
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isSending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8C5E35' }}>
              <Bot size={16} />
              <span style={{ fontSize: '0.82rem', fontStyle: 'italic' }}>
                Gemini está analizando los datos y redactando el informe ejecutivo...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias de Preguntas */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid #F0ECE4',
            backgroundColor: '#FAF8F5',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            maxWidth: '100%',
          }}
        >
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={isSending}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0DAD0',
                borderRadius: '6px',
                padding: '0.3rem 0.55rem',
                fontSize: '0.74rem',
                color: '#4B433B',
                cursor: 'pointer',
                textAlign: 'left',
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Barra de Entrada (Texto y Micrófono) */}
        <div
          style={{
            padding: '0.85rem 1.25rem 1.15rem 1.25rem',
            borderTop: '1px solid #EAE6DF',
            backgroundColor: '#FFFFFF',
            boxSizing: 'border-box',
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FAF8F5',
              border: isListening ? '2px solid #DC2626' : '1px solid #D1C9BE',
              borderRadius: '9px',
              padding: '0.35rem 0.5rem 0.35rem 0.85rem',
              boxSizing: 'border-box',
              width: '100%',
              minWidth: 0,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? 'Escuchando tu voz...' : 'Pregunta o pide un reporte por IA...'}
              disabled={isSending}
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.85rem',
                color: '#1C1510',
              }}
            />

            <button
              type="button"
              onClick={handleToggleVoice}
              title={isListening ? 'Detener voz' : 'Dictar por voz'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isListening ? '#FEE2E2' : '#FFFFFF',
                color: isListening ? '#DC2626' : '#8C5E35',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputText.trim()}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: inputText.trim() && !isSending ? '#1C1510' : '#D1C9BE',
                color: '#FFFFFF',
                cursor: inputText.trim() && !isSending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
