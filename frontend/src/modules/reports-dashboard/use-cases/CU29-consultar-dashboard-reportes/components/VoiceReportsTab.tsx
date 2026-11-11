import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const VoiceReportsTab: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [lastExchange, setLastExchange] = useState<{
    userPrompt: string;
    aiReply: string;
    keyMetrics?: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }[];
    engine?: string;
    timestamp: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => {
    mountedRef.current = false;
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
    recorder?.stream.getTracks().forEach(track => track.stop());
  }; }, []);
  const toggleServerRecording = async () => {
    if (recorderRef.current?.state === 'recording') { recorderRef.current.stop(); return; }
    stopVoiceRecognition(); stopSpeechSynthesis(); setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      if (!mountedRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        if (!mountedRef.current) return;
        setRecording(false); setVoiceState('processing');
        try {
          const blob = new Blob(chunks, {type: recorder.mimeType});
          if (blob.size > 6000000) throw new Error('La grabación excede 6 MB.');
          const encoded = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob);
          });
          const text = await reportsService.transcribe(encoded, recorder.mimeType);
          if (!mountedRef.current) return;
          setTranscriptText(text); await executeQuery(text);
        } catch (error: any) {
          if (!mountedRef.current) return;
          setVoiceState('idle'); setErrorMessage(error.response?.data?.message || error.message || 'No se pudo transcribir la grabación.');
        }
      };
      recorder.start(); setRecording(true);
      recordingTimerRef.current = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 60000);
    } catch { setErrorMessage('No se pudo abrir el micrófono. Comprueba los permisos y utiliza HTTPS o localhost.'); }
  };
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar y chequear soporte de Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage(
        'Este navegador no soporta Web Speech API de forma nativa. Recomendamos Google Chrome o Microsoft Edge para consultas de voz.',
      );
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices();
    }

    return () => {
      stopVoiceRecognition();
      stopSpeechSynthesis();
    };
  }, []);

  // Función para reproducir el audio generado en el backend (fallback universal garantizado)
  const speakWithBackendFallback = async (cleanSpeech: string) => {
    try {
      setVoiceState('speaking');
      const blob = await reportsService.getSpeechAudio(cleanSpeech);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 1.18;
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.warn('Audio element error:', e);
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.warn('Fallo en síntesis de audio del backend:', err);
      setVoiceState('idle');
    }
  };

  // Función para detener la síntesis de voz (TTS)
  const stopSpeechSynthesis = () => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (voiceState === 'speaking') {
      setVoiceState('idle');
    }
  };

  // Función para hablar el texto (TTS)
  const speakText = async (text: string) => {
    if (!text) return;

    // Detener cualquier audio previo
    stopSpeechSynthesis();

    // Limpieza de markdown y adaptación fonética para que la pronunciación sea fluida y natural
    const cleanSpeech = text
      .replace(/[*_#`]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/--+/g, '')
      .replace(/Bs\./gi, 'Bolivianos')
      .replace(/USD/gi, 'dólares')
      .replace(/\$/g, 'dólares ')
      .trim();

    if (!cleanSpeech) return;

    // Verificar si el navegador tiene soporte nativo funcional con voces disponibles
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const voices = hasSpeechSynthesis ? window.speechSynthesis.getVoices() : [];
    const hasLocalVoices = voices && voices.length > 0;

    // Si el navegador no tiene voces locales (caso de Chromium/Brave en Linux sin flags),
    // usamos de forma transparente el sintetizador del backend que funciona al 100%
    if (!hasSpeechSynthesis || !hasLocalVoices) {
      await speakWithBackendFallback(cleanSpeech);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utteranceRef.current = utterance;

      const esVoices = voices.filter(
        (v) => v.lang.startsWith('es') || v.lang.includes('es'),
      );

      // Preferir voces femeninas cálidas por nombre
      const femaleKeywords = [
        'sabina', 'monica', 'mónica', 'paulina', 'helena', 'laura', 'victoria',
        'lucia', 'lucía', 'conchita', 'elena', 'maria', 'maría', 'carmen',
        'sofia', 'sofía', 'female', 'femenina', 'mujer'
      ];
      const femaleVoice = esVoices.find((v) =>
        femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw)),
      );
      const esVoice =
        femaleVoice ||
        esVoices.find((v) => v.lang.startsWith('es-BO')) ||
        esVoices[0];

      if (esVoice) {
        utterance.voice = esVoice;
        utterance.lang = esVoice.lang;
      } else {
        utterance.lang = 'es-ES';
      }

      utterance.rate = 1.18;
      utterance.pitch = 1.08;

      utterance.onstart = () => {
        setVoiceState('speaking');
      };

      utterance.onend = () => {
        setVoiceState('idle');
      };

      utterance.onerror = async (e) => {
        console.warn('SpeechSynthesis error en navegador, activando fallback de backend:', e);
        // Si el navegador falla por política de autoplay o error de socket, usamos el fallback
        await speakWithBackendFallback(cleanSpeech);
      };

      // Pequeño retardo para evitar la condición de carrera en Chromium al cancelar
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (err) {
      console.warn('Error al iniciar SpeechSynthesis, usando backend:', err);
      await speakWithBackendFallback(cleanSpeech);
    }
  };

  // Detener reconocimiento de voz
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
  };

  // Procesar consulta final con IA
  const executeQuery = async (query: string) => {
    if (!query.trim()) {
      setVoiceState('idle');
      return;
    }

    setVoiceState('processing');
    setErrorMessage(null);

    try {
      const res = await reportsService.sendAiChat({
        message: query.trim(),
      });

      const exchangeData = {
        userPrompt: query.trim(),
        aiReply: res.reply,
        keyMetrics: res.keyMetrics,
        engine: res.engine || 'Gemini 3.5 Flash Lite + ai_readonly DB',
        timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      };

      setLastExchange(exchangeData);
      setTranscriptText('');
      setInterimText('');

      // Hablar la respuesta de inmediato
      speakText(res.reply);
    } catch (err: any) {
      console.error('Error al procesar consulta por voz:', err);
      setVoiceState('idle');
      setErrorMessage(
        'Ocurrió una dificultad al conectar con el motor analítico de base de datos. Por favor vuelve a intentarlo.',
      );
    }
  };

  // Iniciar reconocimiento de voz
  const startListening = async () => {
    if (recorderRef.current?.state === 'recording') return;
    stopSpeechSynthesis();
    setErrorMessage(null);
    setTranscriptText('');
    setInterimText('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Tu navegador no cuenta con Web Speech API activo.');
      return;
    }

    stopVoiceRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const userLang = navigator.language || 'es-419';
      recognition.lang = userLang.startsWith('es') ? userLang : 'es-419';
      // Prefer an installed on-device language pack when the browser supports it.
      if (typeof SpeechRecognition.available === 'function' && 'processLocally' in recognition) {
        try {
          const status = await SpeechRecognition.available({ langs: [recognition.lang], processLocally: true });
          recognition.processLocally = status === 'available';
        } catch {
          // Availability may be restricted by browser policy; retain the default service.
        }
      }
      recognition.continuous = false;
      recognition.interimResults = true;

      let finalCaptured = '';
      let recognitionFailed = false;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalCaptured += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscriptText(finalCaptured);
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        recognitionFailed = true;
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            'Permiso de micrófono denegado. Permite el acceso al micrófono en el icono de permisos de la barra de direcciones de tu navegador.',
          );
        } else if (event.error === 'network') {
          setErrorMessage(
            'El servicio de reconocimiento de voz del navegador no responde. Puede ocurrir tambi?n en Chrome o Edge. Comprueba la conexi?n y posibles bloqueos de red; puedes escribir tu consulta mientras el servicio se recupera.',
          );
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Aviso del micrófono: ${event.error}`);
        }
        setVoiceState('idle');
      };

      recognition.onend = () => {
        if (recognitionFailed) { setVoiceState('idle'); return; }
        const textToProcess = finalCaptured.trim();
        if (textToProcess) {
          executeQuery(textToProcess);
        } else {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error al iniciar el reconocedor de voz:', err);
      setVoiceState('idle');
      setErrorMessage('No fue posible inicializar el dispositivo de captura de voz.');
    }
  };

  // Toggle del botón central
  const handleCentralMicClick = () => {
    if (voiceState === 'listening') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    } else if (voiceState === 'speaking') {
      stopSpeechSynthesis();
    } else if (voiceState === 'processing') {
      // esperando respuesta
    } else {
      startListening();
    }
  };

  const sampleVoiceQueries = [
    '¿Cuáles son las ventas acumuladas del mes por sucursal?',
    '¿Qué prendas tienen inventario bajo en tiendas?',
    '¿Cuáles son los 5 clientes con mayor volumen de compras?',
    '¿Cuál es la comparativa de rendimiento entre sucursales?',
    '¿Cuántas prendas se vendieron hoy en total?',
    'Dame un resumen ejecutivo del estado del inventario',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1rem 3rem 1rem',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes voiceRipple {
          0% {
            box-shadow: 0 0 0 0 rgba(196, 149, 106, 0.45);
          }
          70% {
            box-shadow: 0 0 0 28px rgba(196, 149, 106, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(196, 149, 106, 0);
          }
        }
        @keyframes voiceRippleActive {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55);
          }
          70% {
            box-shadow: 0 0 0 36px rgba(220, 38, 38, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
          }
        }
        @keyframes soundWave {
          0%, 100% { height: 8px; }
          50% { height: 26px; }
        }
      `}</style>

      <div style={{padding: '12px', textAlign: 'center'}}>
        <button type="button" onClick={toggleServerRecording} disabled={!recording && voiceState !== 'idle'}>
          {recording ? 'Detener y transcribir' : 'Grabar con transcriptor del servidor'}
        </button>
        <p>Alternativa al reconocimiento del navegador. Requiere un servicio de transcripción configurado por el administrador. Máximo 60 segundos.</p>
      </div>
      {/* Encabezado del Entorno de Voz Compacto */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem', maxWidth: '680px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: '#FAF5EE',
            border: '1px solid #E4D7C5',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#8C5E35',
            marginBottom: '0.45rem',
          }}
        >
          <Sparkles size={13} color="#C4956A" />
          <span>Consulta y Explicación de Reportes Ejecutivos por Voz</span>
        </div>

        <h2
          style={{
            fontSize: '1.38rem',
            fontWeight: 800,
            color: '#1C1510',
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display, Georgia, serif)',
          }}
        >
          Asistente de Voz Inteligente para Reportes
        </h2>
        <p style={{ color: '#736B63', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>
          Interactúa 100% mediante voz. Realiza tu pregunta hablando al micrófono y la inteligencia
          artificial consultará los datos en vivo para explicártelo con voz audible y métricas
          precisas.
        </p>
      </div>

      {/* Alerta de Error si ocurre */}
      {errorMessage && (
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.86rem',
            boxSizing: 'border-box',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, wordBreak: 'break-word' }}>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* SECCIÓN CENTRAL: BOTÓN DE MICRÓFONO GRANDE E INDICADORES ACÚSTICOS */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: '#FAF8F5',
          borderRadius: '24px',
          border: '1px solid #EAE6DF',
          width: '100%',
          maxWidth: '720px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          marginBottom: '2rem',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Onda de visualización sonora superior */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            height: '32px',
            marginBottom: '1.5rem',
          }}
        >
          {[0.2, 0.5, 0.8, 1, 0.6, 0.9, 0.4, 0.7].map((heightFactor, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                borderRadius: '999px',
                backgroundColor:
                  voiceState === 'listening'
                    ? '#DC2626'
                    : voiceState === 'speaking'
                      ? '#059669'
                      : voiceState === 'processing'
                        ? '#D97706'
                        : '#D1C9BE',
                height:
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? `${Math.max(8, heightFactor * 30)}px`
                    : '6px',
                animation:
                  voiceState === 'listening' || voiceState === 'speaking'
                    ? `soundWave 0.8s ease-in-out infinite alternate ${i * 0.1}s`
                    : 'none',
                transition: 'height 0.2s ease, background-color 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Botón Central Grande */}
        <button
          type="button"
          onClick={handleCentralMicClick}
          disabled={!speechSupported || voiceState === 'processing'}
          style={{
            width: '136px',
            height: '136px',
            borderRadius: '50%',
            backgroundColor:
              voiceState === 'listening'
                ? '#DC2626'
                : voiceState === 'speaking'
                  ? '#1C1510'
                  : voiceState === 'processing'
                    ? '#D97706'
                    : '#1C1510',
            border:
              voiceState === 'listening'
                ? '4px solid #FEE2E2'
                : voiceState === 'speaking'
                  ? '4px solid #A7F3D0'
                  : '4px solid #EAE6DF',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !speechSupported || voiceState === 'processing' ? 'not-allowed' : 'pointer',
            boxShadow:
              voiceState === 'listening'
                ? '0 0 0 10px rgba(220, 38, 38, 0.2), 0 12px 30px rgba(220, 38, 38, 0.35)'
                : voiceState === 'speaking'
                  ? '0 0 0 10px rgba(16, 185, 129, 0.2), 0 12px 30px rgba(0, 0, 0, 0.25)'
                  : '0 8px 24px rgba(0, 0, 0, 0.16)',
            animation:
              voiceState === 'listening'
                ? 'voiceRippleActive 1.6s infinite'
                : voiceState === 'idle'
                  ? 'voiceRipple 2.8s infinite'
                  : 'none',
            transition: 'transform 0.15s ease, background-color 0.25s ease',
            outline: 'none',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title={
            voiceState === 'listening'
              ? 'Detener escucha y consultar'
              : voiceState === 'speaking'
                ? 'Detener voz en reproducción'
                : 'Presiona para hablar'
          }
        >
          {voiceState === 'listening' ? (
            <MicOff size={52} color="#FFFFFF" />
          ) : voiceState === 'speaking' ? (
            <Volume2 size={52} color="#34D399" />
          ) : voiceState === 'processing' ? (
            <Sparkles size={52} color="#FDE68A" />
          ) : (
            <Mic size={52} color="#C4956A" />
          )}
        </button>

        {/* Estado en Texto debajo del botón */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color:
                voiceState === 'listening'
                  ? '#DC2626'
                  : voiceState === 'speaking'
                    ? '#059669'
                    : voiceState === 'processing'
                      ? '#D97706'
                      : '#1C1510',
            }}
          >
            {voiceState === 'listening' && 'Escuchando tu voz... Habla con tranquilidad'}
            {voiceState === 'processing' && 'Consultando base de datos y redactando informe...'}
            {voiceState === 'speaking' && 'Reproduciendo informe ejecutivo por voz...'}
            {voiceState === 'idle' && 'Presiona el micrófono para hablar'}
          </div>

          <p
            style={{
              fontSize: '0.82rem',
              color: '#8C5E35',
              margin: '0.35rem 0 0 0',
              fontWeight: 500,
            }}
          >
            {voiceState === 'listening' && 'Presiona el botón nuevamente cuando termines de hablar'}
            {voiceState === 'speaking' && 'Presiona el botón o "Detener audio" para pausar'}
            {voiceState === 'processing' && 'Extrayendo métricas consolidadas'}
            {voiceState === 'idle' && 'Sin escritura de teclado: 100% reconocimiento y síntesis vocal'}
          </p>
        </div>

        {/* Transcripción en vivo mientras habla */}
        {(interimText || transcriptText) && voiceState === 'listening' && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #FCA5A5',
              width: '90%',
              maxWidth: '560px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: 700, display: 'block' }}>
              TRANSCRIPCIÓN EN VIVO:
            </span>
            <span style={{ fontSize: '0.92rem', color: '#1C1510', fontWeight: 600 }}>
              {transcriptText} <span style={{ color: '#8C5E35', fontStyle: 'italic' }}>{interimText}</span>
            </span>
          </div>
        )}

        {/* Barra de controles de sonido cuando ya hay un reporte */}
        {lastExchange && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              justifyContent: 'center',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #EAE6DF',
              width: '100%',
            }}
          >
            <button
              type="button"
              onClick={() => speakText(lastExchange.aiReply)}
              disabled={voiceState === 'listening' || voiceState === 'processing'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1C9BE',
                borderRadius: '8px',
                padding: '0.55rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#1C1510',
                cursor: 'pointer',
              }}
            >
              <Volume2 size={16} color="#8C5E35" />
              <span>Escuchar de nuevo (Audio)</span>
            </button>

            {voiceState === 'speaking' && (
              <button
                type="button"
                onClick={stopSpeechSynthesis}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#991B1B',
                  cursor: 'pointer',
                }}
              >
                <VolumeX size={16} />
                <span>Detener audio</span>
              </button>
            )}

            <button
              type="button"
              onClick={startListening}
              disabled={voiceState === 'listening' || voiceState === 'processing'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#1C1510',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} color="#C4956A" />
              <span>Nueva consulta por voz</span>
            </button>
          </div>
        )}
      </div>

      {/* TARJETA DEL REPORTE HABLADO CONSOLIDADO */}
      {lastExchange && (
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAE6DF',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            marginBottom: '2rem',
            boxSizing: 'border-box',
          }}
        >
          {/* Cabecera del reporte */}
          <div
            style={{
              padding: '1rem 1.35rem',
              backgroundColor: '#FAF8F5',
              borderBottom: '1px solid #EAE6DF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#1C1510',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <Bot size={15} color="#C4956A" />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1C1510' }}>
                  Informe Ejecutivo Generado por Voz
                </div>
                <div style={{ fontSize: '0.72rem', color: '#736B63' }}>
                  Hora: {lastExchange.timestamp}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={13} />
              <span>{lastExchange.engine}</span>
            </div>
          </div>

          <div style={{ padding: '1.35rem' }}>
            {/* Pregunta hablada por el usuario */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#F7F5F1',
                borderRadius: '10px',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#8C5E35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                <User size={12} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: '#8C5E35', fontWeight: 700 }}>
                  TU CONSULTA HABLADA:
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1C1510', fontWeight: 600, marginTop: '2px' }}>
                  "{lastExchange.userPrompt}"
                </div>
              </div>
            </div>

            {/* Explicación ejecutiva de la IA */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#736B63',
                  fontWeight: 700,
                  marginBottom: '0.45rem',
                  letterSpacing: '0.04em',
                }}
              >
                EXPLICACIÓN EJECUTIVA HABLADA:
              </div>
              <div
                style={{
                  fontSize: '0.92rem',
                  lineHeight: '1.65',
                  color: '#1C1510',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                {lastExchange.aiReply}
              </div>
            </div>

            {/* Métricas clave devueltas por la consulta */}
            {lastExchange.keyMetrics && lastExchange.keyMetrics.length > 0 && (
              <div
                style={{
                  paddingTop: '1.15rem',
                  borderTop: '1px solid #F0ECE4',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#736B63',
                    fontWeight: 700,
                    marginBottom: '0.65rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  INDICADORES CLAVE EXTRAÍDOS:
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.65rem',
                  }}
                >
                  {lastExchange.keyMetrics.map((kpi, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#FAF8F5',
                        border: '1px solid #EAE6DF',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: '#736B63', fontWeight: 600 }}>
                        {kpi.label}
                      </div>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#1C1510',
                          marginTop: '0.2rem',
                        }}
                      >
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUGERENCIAS DE CONSULTAS POR VOZ (GUÍA PARA EL USUARIO) */}
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#FAF8F5',
          borderRadius: '16px',
          border: '1px solid #EAE6DF',
          padding: '1.25rem 1.5rem',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.85rem',
          }}
        >
          <HelpCircle size={16} color="#8C5E35" />
          <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: '#1C1510' }}>
            Ejemplos que puedes decir en voz alta:
          </h4>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {sampleVoiceQueries.map((query, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (voiceState !== 'processing' && voiceState !== 'listening') {
                  executeQuery(query);
                }
              }}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE6DF',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8rem',
                color: '#4B433B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C4956A';
                e.currentTarget.style.backgroundColor = '#FCFBF9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#EAE6DF';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
              title="Haz clic para probar esta consulta o dila con tu voz"
            >
              <Mic size={13} color="#8C5E35" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, wordBreak: 'break-word' }}>"{query}"</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
