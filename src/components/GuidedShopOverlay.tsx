import React, { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Sparkles, Package, FileText, Video } from 'lucide-react';
import { QUIZ_QUESTIONS, QuizAnswers, QuizQuestion } from '../data/quizQuestions';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  role: string;
  image_url: string | null;
}

interface DigitalContent {
  id: string;
  type: string;
  title: string;
  description: string | null;
}

interface BoxComposition {
  price: number;
  products: Product[];
  digital_contents: DigitalContent[];
  total_product_value: number;
  description: string;
}

interface Analysis {
  focus: string;
  intensity: string;
  problem_description: string;
  needed_products: string[];
}

interface GuidedShopOverlayProps {
  onClose: () => void;
  onComplete?: (sessionId: string, selectedBox: BoxComposition) => void;
}

const GuidedShopOverlay: React.FC<GuidedShopOverlayProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [boxes, setBoxes] = useState<BoxComposition[]>([]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;


  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentQuestion.id === 'welcome') {
      setTimeout(() => setCurrentStep(1), 300);
    } else if (isLastQuestion) {
      composeBoxes(newAnswers);
    } else {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleMultipleAnswer = (value: string) => {
    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
    const newAnswers = currentAnswers.includes(value)
      ? currentAnswers.filter(v => v !== value)
      : [...currentAnswers, value];

    setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
  };

  const composeBoxes = async (finalAnswers: QuizAnswers) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compose-routine-boxes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'x-shop-key': import.meta.env.VITE_SHOP_FUNCTION_KEY || ''
          },
          body: JSON.stringify({ answers: finalAnswers })
        }
      );

      if (!response.ok) throw new Error('Failed to compose boxes');

      const data = await response.json();
      setBoxes(data.boxes);
      setAnalysis(data.analysis);

      const { data: session } = await supabase
        .from('guided_shop_sessions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          quiz_answers: finalAnswers,
          detected_focus: data.analysis.focus,
          intensity_level: data.analysis.intensity,
          recommended_boxes: data.boxes
        })
        .select()
        .single();

      setShowResults(true);
    } catch (error) {
      console.error('Error composing boxes:', error);
      alert('Si è verificato un errore. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBox = (box: BoxComposition) => {
    setSelectedBox(box.price);
    setShowDetails(true);
  };

  const handleConfirmBox = () => {
    const box = boxes.find(b => b.price === selectedBox);
    if (box && onComplete) {
      onComplete('session-id', box);
    }
  };

  const goBack = () => {
    if (showDetails) {
      setShowDetails(false);
    } else if (currentStep > 0 && !showResults) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-200 border-t-rose-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sto creando la tua routine personalizzata
          </h3>
          <p className="text-gray-600">
            Analizzando le tue risposte per selezionare i prodotti perfetti per te...
          </p>
        </div>
      </div>
    );
  }

  if (showDetails && selectedBox !== null) {
    const box = boxes.find(b => b.price === selectedBox)!;
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">La tua Box {box.price}€</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {box.description}
                  </h3>
                  <p className="text-gray-700">
                    Ho selezionato {box.products.length} prodotti specifici per le tue esigenze,
                    per un valore totale di {box.total_product_value.toFixed(2)}€.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-rose-700" />
                </div>
                Prodotti inclusi
              </h4>
              <div className="space-y-4">
                {Array.isArray(box.products) && box.products.map((product) => (
                  <div key={product.id} className="flex items-start gap-4 p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-rose-100">
                      <Package className="w-8 h-8 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900">{product.name}</h5>
                      <p className="text-base text-rose-700 font-bold mt-1">
                        {product.price.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-pink-700" />
                </div>
                Contenuti digitali inclusi
              </h4>
              <div className="space-y-4">
                {Array.isArray(box.digital_contents) && box.digital_contents.map((content) => (
                  <div key={content.id} className="flex items-start gap-4 p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-pink-100">
                      {content.type === 'video' ? (
                        <Video className="w-7 h-7 text-pink-600" />
                      ) : (
                        <FileText className="w-7 h-7 text-pink-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900">{content.title}</h5>
                      <p className="text-sm text-gray-700 mt-1">{content.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl">
                <span className="text-xl font-bold text-gray-900">Totale</span>
                <span className="text-4xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{box.price}€</span>
              </div>

              <button
                onClick={handleConfirmBox}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                Aggiungi al carrello
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl max-w-5xl w-full mx-auto shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">La tua routine personalizzata</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Sezione Analisi Problema */}
            {analysis && (
              <>
                <div className="bg-gradient-to-br from-rose-100 via-pink-100 to-rose-100 rounded-2xl p-8 border border-rose-200">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center flex-shrink-0 border-2 border-rose-200">
                      <Sparkles className="w-7 h-7 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Ho analizzato le tue esigenze
                      </h3>
                      <p className="text-gray-800 leading-relaxed text-lg">
                        {analysis.problem_description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sezione Prodotti Necessari */}
                <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 rounded-2xl p-8 border border-pink-200">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center flex-shrink-0 border-2 border-pink-200">
                      <Package className="w-7 h-7 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        Di cosa hai bisogno
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Array.isArray(analysis.needed_products) && analysis.needed_products.map((product, index) => (
                          <div key={index} className="flex items-start gap-3 bg-white rounded-xl p-5 shadow-md border border-pink-100 hover:shadow-lg transition-shadow">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-5 h-5 text-rose-700" />
                            </div>
                            <p className="text-gray-900 font-semibold leading-snug">{product}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sezione Opzioni Box */}
            <div>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 px-8 py-4 rounded-full font-bold mb-4 shadow-md border border-rose-200">
                  <Sparkles className="w-6 h-6" />
                  Basato sulle tue risposte
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Le tue opzioni personalizzate
                </h3>
                <p className="text-gray-700 max-w-2xl mx-auto text-lg">
                  Ho preparato 3 opzioni di routine, ciascuna calibrata per supportarti al meglio.
                  Scegli il livello di supporto che preferisci.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
              {Array.isArray(boxes) && boxes.map((box) => (
                <div
                  key={box.price}
                  className={`border-3 rounded-2xl p-7 cursor-pointer transition-all ${
                    box.price === 49
                      ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-xl scale-105 relative'
                      : 'border-gray-300 bg-white hover:border-rose-400 hover:shadow-xl hover:scale-102'
                  }`}
                  onClick={() => handleSelectBox(box)}
                >
                  {box.price === 49 && (
                    <>
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                          PIÙ SCELTO
                        </div>
                      </div>
                      <div className="h-6"></div>
                    </>
                  )}
                  <div className="text-center mb-6">
                    <div className="text-5xl font-extrabold bg-gradient-to-br from-rose-600 to-pink-600 bg-clip-text text-transparent mb-3">
                      {box.price}€
                    </div>
                    <p className="text-base text-gray-700 font-semibold">{box.description}</p>
                  </div>

                  <div className="space-y-5 mb-6">
                    {/* Prodotti inclusi */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Prodotti inclusi
                      </h4>
                      <div className="space-y-2">
                        {box.products.map((product, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-2.5 h-2.5 text-rose-700" />
                            </div>
                            <span className="font-medium leading-tight">{product.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bonus digitali inclusi */}
                    <div>
                      <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        In più ricevi gratis
                      </h4>
                      <div className="space-y-2">
                        {box.digital_contents.map((content, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-2.5 h-2.5 text-pink-700" />
                            </div>
                            <span className="font-medium leading-tight">{content.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`w-full py-4 rounded-xl font-bold transition-all text-base ${
                      box.price === 49
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 shadow-lg'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-rose-100 hover:to-pink-100 hover:text-rose-900'
                    }`}
                  >
                    Vedi dettagli
                  </button>
                </div>
              ))}
              </div>

              {/* Link al catalogo */}
              <div className="mt-10 text-center">
                <p className="text-gray-600 mb-4 text-lg">Non ti convince?</p>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold text-lg underline underline-offset-4 transition-colors"
                >
                  Sfoglia il catalogo completo
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto shadow-2xl">
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            {currentStep > 0 && (
              <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-gray-500">
                Domanda {currentStep + 1} di {QUIZ_QUESTIONS.length}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-600 to-pink-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent mb-4">
            {currentQuestion.question}
          </h2>
          {currentQuestion.description && (
            <p className="text-gray-700 mb-8 text-lg">{currentQuestion.description}</p>
          )}

          <div className="space-y-3">
            {currentQuestion.type === 'multiple' ? (
              currentQuestion.options?.map((option) => {
                const isSelected = ((answers[currentQuestion.id] as string[]) || []).includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMultipleAnswer(option.value)}
                    className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-md'
                        : 'border-gray-300 hover:border-rose-400 hover:bg-rose-50/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isSelected ? 'border-rose-600 bg-gradient-to-br from-rose-600 to-pink-600 shadow-sm' : 'border-gray-400'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        {option.subtitle && (
                          <div className="text-sm text-gray-600 mt-1">{option.subtitle}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              currentQuestion.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full text-left p-6 rounded-xl border-2 border-gray-300 hover:border-rose-500 hover:bg-gradient-to-br hover:from-rose-50 hover:to-pink-50 transition-all group hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 group-hover:text-rose-700 transition-colors">
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-sm text-gray-600 mt-1">{option.subtitle}</div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-rose-600 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))
            )}
          </div>

          {currentQuestion.id === 'welcome' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⏱</span>
                  </div>
                  <span>2 minuti</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎯</span>
                  </div>
                  <span>Risultato immediato</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🛍️</span>
                  </div>
                  <span>Nessun obbligo di acquisto</span>
                </div>
              </div>
            </div>
          )}

          {currentQuestion.type === 'multiple' && (
            <button
              onClick={() => {
                if (isLastQuestion) {
                  composeBoxes(answers);
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={!answers[currentQuestion.id] || (answers[currentQuestion.id] as string[]).length === 0}
              className="mt-6 w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:shadow-none"
            >
              Continua
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidedShopOverlay;
