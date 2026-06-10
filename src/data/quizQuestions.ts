export interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  type: 'single' | 'multiple' | 'scale';
  options?: QuizOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

export interface QuizOption {
  value: string;
  label: string;
  subtitle?: string;
  focusMapping?: string[];
  intensityWeight?: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'welcome',
    question: 'Non sai da dove iniziare? Partiamo da qui',
    description: 'Se ti senti confusa tra prodotti, consigli diversi e mille soluzioni possibili, questo breve sondaggio ti aiuta a fare chiarezza.',
    type: 'single',
    options: [
      { value: 'start', label: 'Iniziamo!' }
    ]
  },
  {
    id: 'main_concern',
    question: 'Qual è la tua esigenza principale in questo momento?',
    description: 'Non esiste una risposta giusta o sbagliata. Scegli ciò che senti più vicino a te oggi.',
    type: 'single',
    options: [
      {
        value: 'digestive',
        label: 'Benessere digestivo',
        subtitle: 'Gonfiore, irregolarità, sensazione di pesantezza',
        focusMapping: ['pancia'],
        intensityWeight: 1
      },
      {
        value: 'drainage',
        label: 'Ritenzione e drenaggio',
        subtitle: 'Gambe pesanti, gonfiore, ritenzione idrica',
        focusMapping: ['drenaggio'],
        intensityWeight: 1
      },
      {
        value: 'energy',
        label: 'Energia e vitalità',
        subtitle: 'Stanchezza, affaticamento, calo di concentrazione',
        focusMapping: ['energia'],
        intensityWeight: 1
      },
      {
        value: 'stress_sleep',
        label: 'Stress e qualità del sonno',
        subtitle: 'Tensione, ansia, difficoltà a riposare bene',
        focusMapping: ['stress', 'sonno'],
        intensityWeight: 1
      }
    ]
  },
  {
    id: 'daily_impact',
    question: 'Come influisce questa situazione sulla tua vita quotidiana?',
    description: 'Aiutami a capire l\'impatto reale che ha su di te.',
    type: 'single',
    options: [
      {
        value: 'occasional',
        label: 'Ogni tanto mi crea un po\' di fastidio',
        subtitle: 'È sporadico, ci penso solo quando succede',
        intensityWeight: 1
      },
      {
        value: 'frequent',
        label: 'Mi condiziona regolarmente',
        subtitle: 'Succede spesso e influenza le mie giornate',
        intensityWeight: 2
      },
      {
        value: 'constant',
        label: 'È una presenza costante',
        subtitle: 'Mi accompagna ogni giorno, limita ciò che posso fare',
        intensityWeight: 3
      }
    ]
  },
  {
    id: 'specific_symptoms',
    question: 'Quali di questi ti risuona di più?',
    description: 'Puoi selezionare anche più di una risposta.',
    type: 'multiple',
    options: [
      {
        value: 'bloating',
        label: 'Gonfiore addominale dopo i pasti',
        focusMapping: ['pancia']
      },
      {
        value: 'irregularity',
        label: 'Irregolarità intestinale',
        focusMapping: ['pancia']
      },
      {
        value: 'heaviness',
        label: 'Sensazione di pesantezza',
        focusMapping: ['pancia', 'drenaggio']
      },
      {
        value: 'swelling',
        label: 'Gonfiore a gambe o caviglie',
        focusMapping: ['drenaggio']
      },
      {
        value: 'fatigue',
        label: 'Stanchezza persistente',
        focusMapping: ['energia']
      },
      {
        value: 'brain_fog',
        label: 'Difficoltà di concentrazione',
        focusMapping: ['energia', 'stress']
      },
      {
        value: 'tension',
        label: 'Tensione muscolare o mentale',
        focusMapping: ['stress']
      },
      {
        value: 'sleep_issues',
        label: 'Difficoltà ad addormentarsi o sonno leggero',
        focusMapping: ['sonno', 'stress']
      }
    ]
  },
  {
    id: 'time_of_day',
    question: 'In quale momento della giornata senti più il bisogno di supporto?',
    description: 'Questo mi aiuta a capire meglio il ritmo del tuo corpo.',
    type: 'single',
    options: [
      {
        value: 'morning',
        label: 'Al mattino',
        subtitle: 'Fatico a partire, ho bisogno di una spinta',
        focusMapping: ['energia']
      },
      {
        value: 'afternoon',
        label: 'Nel pomeriggio',
        subtitle: 'Calo di energia, pesantezza dopo pranzo',
        focusMapping: ['energia', 'pancia']
      },
      {
        value: 'evening',
        label: 'La sera',
        subtitle: 'Accumulo tensione, gonfiore, difficoltà a rilassarmi',
        focusMapping: ['stress', 'sonno', 'drenaggio']
      },
      {
        value: 'allday',
        label: 'Durante tutta la giornata',
        subtitle: 'È una sensazione continua',
        intensityWeight: 2
      }
    ]
  },
  {
    id: 'lifestyle',
    question: 'Parlami un po\' del tuo stile di vita attuale',
    description: 'Non ti sto giudicando, voglio solo aiutarti meglio.',
    type: 'single',
    options: [
      {
        value: 'sedentary',
        label: 'Prevalentemente sedentario',
        subtitle: 'Lavoro da seduto, poco movimento',
        focusMapping: ['drenaggio', 'energia']
      },
      {
        value: 'moderately_active',
        label: 'Moderatamente attivo',
        subtitle: 'Cammino un po\', ma potrei fare di più',
        intensityWeight: 0
      },
      {
        value: 'active',
        label: 'Attivo',
        subtitle: 'Mi muovo regolarmente, faccio sport',
        intensityWeight: 0
      },
      {
        value: 'stressed',
        label: 'Ritmi intensi e stressanti',
        subtitle: 'Poco tempo per me, sempre di corsa',
        focusMapping: ['stress', 'energia']
      }
    ]
  },
  {
    id: 'goals',
    question: 'Cosa ti piacerebbe ottenere nei prossimi 30 giorni?',
    description: 'Immagina come ti sentiresti se questa situazione migliorasse.',
    type: 'single',
    options: [
      {
        value: 'feel_lighter',
        label: 'Sentirmi più leggero e sgonfio',
        focusMapping: ['pancia', 'drenaggio']
      },
      {
        value: 'more_energy',
        label: 'Avere più energia durante la giornata',
        focusMapping: ['energia']
      },
      {
        value: 'better_sleep',
        label: 'Dormire meglio e svegliarmi riposato',
        focusMapping: ['sonno', 'stress']
      },
      {
        value: 'less_stress',
        label: 'Sentirmi meno teso e più sereno',
        focusMapping: ['stress']
      },
      {
        value: 'overall_wellness',
        label: 'Un benessere generale più equilibrato',
        subtitle: 'Voglio sentirmi semplicemente bene',
        intensityWeight: 0
      }
    ]
  },
  {
    id: 'commitment',
    question: 'Quanto sei disposto a impegnarti per raggiungere questi obiettivi?',
    description: 'La tua onestà mi permette di suggerirti la routine più adatta a te.',
    type: 'single',
    options: [
      {
        value: 'gentle_start',
        label: 'Voglio iniziare con calma',
        subtitle: 'Pochi prodotti essenziali, routine semplice',
        intensityWeight: -1
      },
      {
        value: 'balanced',
        label: 'Sono pronto a un approccio equilibrato',
        subtitle: 'Voglio risultati ma con gradualità',
        intensityWeight: 0
      },
      {
        value: 'committed',
        label: 'Sono molto motivato',
        subtitle: 'Voglio dare il massimo, routine completa',
        intensityWeight: 1
      }
    ]
  }
];

export interface QuizAnswers {
  [questionId: string]: string | string[];
}

export interface AnalyzedResult {
  focus: 'pancia' | 'drenaggio' | 'energia' | 'stress-sonno';
  intensity: 1 | 2 | 3;
  focusLabel: string;
  intensityLabel: string;
  summary: string;
}
