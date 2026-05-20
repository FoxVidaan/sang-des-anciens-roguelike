import { Event, MetaProgression, Player, ScenarioDefinition } from '../../../models/game.models';

const hasTruth = (meta: MetaProgression, truth: string): boolean =>
  meta.discoveredTruths.includes(truth);

const hasChoice = (meta: MetaProgression, choice: string): boolean =>
  meta.unlockedChoices.includes(choice);

const seenCount = (meta: MetaProgression, eventId: string): number => meta.seenEvents[eventId] ?? 0;

export const ERRANT_DU_TEMPS_EVENTS: Event[] = [
  {
    id: 'academy-day',
    title: 'Une journée ordinaire',
    text: (meta: MetaProgression): string => {
      const visits: number = seenCount(meta, 'academy-day');

      if (visits === 1) {
        return `La cloche du matin ouvre une journée sans relief à l'Académie du Temps. Les élèves rejoignent les cours, les surveillants pressent les retardataires, et l'air sent la craie chaude.`;
      }

      if (visits < 4) {
        return `La même cloche. La même craie. Les mêmes pas dans le hall. Tu sais déjà qui va rire, qui va trébucher, et qui ne verra pas le soir.`;
      }

      return `Le matin recommence encore, mais il n'a plus rien d'ordinaire. Chaque visage familier ressemble à un compte à rebours.`;
    },
    choices: [
      {
        id: 'attend-lesson',
        label: "Assister au cours d'érudition temporelle",
        effect: { insight: 1 },
        log: 'Tu prends place comme si la journée était normale.',
        nextEventId: 'temporal-lesson',
      },
      {
        id: 'visit-archives',
        label: 'Aider aux archives avant le cours',
        effect: { insight: 1, sanity: 1 },
        metaEffect: {
          discoveredTruths: ['archive-morning-access'],
        },
        log: 'Tu gagnes quelques minutes dans les archives avant leur ouverture officielle.',
        nextEventId: 'open-archives',
      },
      {
        id: 'anticipate-day',
        label: 'Utiliser tes souvenirs de la journée',
        effect: { sanity: 5, insight: 2 },
        metaEffect: {
          discoveredTruths: ['academy-routine'],
        },
        log: 'Tu évites trois conversations avant qu’elles commencent.',
        nextEventId: 'warning-courtyard',
        condition: (meta: MetaProgression): boolean => seenCount(meta, 'academy-day') > 1,
      },
      {
        id: 'rush-hidden-route',
        label: "Rejoindre directement l'aile nord",
        effect: { sanity: 6, corruption: 4, insight: 1 },
        log: "Tu abandonnes ton emploi du temps habituel pour foncer vers l'aile nord.",
        nextEventId: 'restricted-wing',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 3 && player.insight >= 6 && hasTruth(meta, 'sealed-north-wing'),
      },
    ],
  },
  {
    id: 'temporal-lesson',
    title: 'Leçon des flux',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'professor-knows')) {
        return `Maître Elian répète sa leçon sur les flux mineurs. Tu vois maintenant ce qu'il évite : la page sur les fissures stables disparaît toujours sous sa main.`;
      }

      return `Maître Elian présente les flux temporels comme une science docile. La classe s'ennuie, sauf quand il referme trop vite un vieux manuel marqué de cire noire.`;
    },
    choices: [
      {
        id: 'take-clean-notes',
        label: 'Noter le cours sérieusement',
        effect: { insight: 2 },
        metaEffect: {
          discoveredTruths: ['flow-basics'],
        },
        log: 'Tes notes donnent enfin une forme aux règles du temps.',
        nextEventId: 'bell-corridor',
      },
      {
        id: 'follow-archmage-lecture',
        label: 'Suivre le chapitre des Archimages éthériques',
        effect: { insight: 2, sanity: 2 },
        metaEffect: {
          discoveredTruths: ['ethereal-archmages'],
        },
        log: 'Le cours rappelle les exploits qui ont fait des Archimages éthériques les maîtres des éléments.',
        nextEventId: 'ethereal-archmages-lesson',
      },
      {
        id: 'question-professor',
        label: 'Interroger Maître Elian',
        effect: { insight: 2, sanity: 3 },
        metaEffect: {
          discoveredTruths: ['professor-knows'],
        },
        log: 'Elian pâlit quand tu prononces le mot Fracture.',
        nextEventId: 'professor-questions',
      },
      {
        id: 'copy-diagram',
        label: 'Copier le schéma interdit',
        effect: { insight: 3, sanity: 7 },
        metaEffect: {
          discoveredTruths: ['temporal-fracture-pattern'],
        },
        log: 'Le schéma reste imprimé dans ta mémoire.',
        nextEventId: 'bell-corridor',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.insight >= 4 && (player.loop >= 2 || hasTruth(meta, 'professor-knows')),
      },
    ],
  },
  {
    id: 'ethereal-archmages-lesson',
    title: 'Les Archimages éthériques',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'avalhar-name')) {
        return `Le cours rappelle que les Archimages éthériques règnent sur l'eau, l'air, la terre et le feu. Tu sais désormais ce que la leçon tait : Avalh'ar, Archimage du Temps, doit venir en secret dans la semaine.`;
      }

      return `La leçon oppose les Archimages éthériques, maîtres des quatre éléments, aux charges primordiales liées au Temps, au Vide et aux Esprits. Le professeur saute les lignes consacrées aux archimages désancrés.`;
    },
    choices: [
      {
        id: 'ask-about-avalhar',
        label: "Demander qui conseille l'école",
        effect: { insight: 2, sanity: 2 },
        metaEffect: {
          discoveredTruths: ['avalhar-name'],
        },
        log: "Un nom échappe au professeur : Avalh'ar, Archimage du Temps, doit venir examiner les anomalies.",
        nextEventId: 'professor-questions',
      },
      {
        id: 'study-etheric-theory',
        label: 'Étudier la théorie éthérique',
        effect: { insight: 3, sanity: 4 },
        metaEffect: {
          discoveredTruths: ['time-has-depth'],
        },
        log: "Tu comprends que le temps n'est pas une ligne, mais une profondeur où les consciences peuvent sombrer.",
        nextEventId: 'bell-corridor',
      },
      {
        id: 'compare-with-fracture',
        label: 'Comparer avec le schéma interdit',
        effect: { insight: 3, corruption: 4 },
        metaEffect: {
          discoveredTruths: ['thanatos-made-fracture'],
        },
        log: "La fissure sous l'académie ressemble moins à un accident qu'à un terrain d'étude, bien plus petit que la Brèche née de Thanatos.",
        nextEventId: 'bell-corridor',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.insight >= 6 && hasTruth(meta, 'temporal-fracture-pattern'),
      },
    ],
  },
  {
    id: 'professor-questions',
    title: 'Questions à Maître Elian',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'thanatos-invincible')) {
        return `Elian ne peut plus traiter tes questions comme de simples curiosités. Il sait que tu as vu la fin et parle avec la prudence d'un homme surveillé par son propre passé.`;
      }

      return `À la fin du cours, Maître Elian range ses livres trop vite. Il accepte une question, une seule, avant de rejoindre le conseil des maîtres.`;
    },
    choices: [
      {
        id: 'question-avalhar',
        label: "Questionner Avalh'ar",
        effect: { insight: 3, sanity: 3 },
        metaEffect: {
          discoveredTruths: ['avalhar-studies-containment'],
          unlockedChoices: ['seek-avalhar-archive'],
        },
        log: "Avalh'ar travaille sur des sceaux théoriques capables de contenir une puissance liée à la Fracture.",
        nextEventId: 'bell-corridor',
        condition: (meta: MetaProgression): boolean => hasTruth(meta, 'avalhar-name'),
      },
      {
        id: 'question-ethereal-fall',
        label: 'Demander pourquoi les Archimages ont chuté',
        effect: { insight: 3, corruption: 5 },
        metaEffect: {
          discoveredTruths: ['archmages-fell-to-thanatos'],
        },
        log: "Les archives affirment que Thanatos était un prodige humain formé par l'Archimage Suprême avant de devenir le Disciple.",
        nextEventId: 'bell-corridor',
        condition: (meta: MetaProgression): boolean => hasTruth(meta, 'ethereal-archmages'),
      },
      {
        id: 'question-loop-rules',
        label: 'Demander comment fonctionne une boucle',
        effect: { insight: 4, sanity: 5 },
        metaEffect: {
          discoveredTruths: ['loop-feeds-on-memory'],
        },
        log: 'Une boucle stable conserve la mémoire comme une dette, pas comme un cadeau.',
        nextEventId: 'bell-corridor',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.insight >= 5 && (player.loop >= 2 || hasTruth(meta, 'thanatos-invincible')),
      },
      {
        id: 'leave-professor',
        label: 'Le laisser partir',
        effect: { sanity: -1, insight: 1 },
        log: 'Tu renonces à insister, mais tu retiens son itinéraire.',
        nextEventId: 'bell-corridor',
      },
    ],
  },
  {
    id: 'open-archives',
    title: 'Archives ouvertes',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'academy-routine')) {
        return `Les registres sont à leur place, mais tu sais déjà quelle page ment. L'aile nord manque encore au plan, comme si le bâtiment refusait son propre souvenir.`;
      }

      return `Les archives publiques sont calmes. On y classe des emplois du temps, des sanctions, des plans de salles, et des demandes d'accès que personne ne lit vraiment.`;
    },
    choices: [
      {
        id: 'study-schedules',
        label: 'Comparer les emplois du temps',
        effect: { insight: 2 },
        metaEffect: {
          discoveredTruths: ['academy-routine'],
        },
        log: 'Tu mémorises les routines de l’académie.',
        nextEventId: 'bell-corridor',
      },
      {
        id: 'search-north-wing',
        label: "Chercher l'aile nord sur les plans",
        effect: { insight: 2, sanity: 3 },
        metaEffect: {
          discoveredTruths: ['sealed-north-wing'],
        },
        log: 'Une aile entière a été grattée des plans officiels.',
        nextEventId: 'bell-corridor',
      },
      {
        id: 'read-incident-ledger',
        label: 'Lire le registre des incidents',
        effect: { insight: 2, corruption: 3 },
        metaEffect: {
          discoveredTruths: ['missing-students'],
        },
        log: 'Plusieurs absences précèdent toujours les accidents temporels.',
        nextEventId: 'bell-corridor',
        condition: (meta: MetaProgression): boolean => hasTruth(meta, 'archive-morning-access'),
      },
      {
        id: 'seek-avalhar-archive',
        label: "Chercher le dossier d'Avalh'ar",
        effect: { insight: 3, sanity: 3 },
        metaEffect: {
          discoveredTruths: ['avalhar-hidden-archive'],
        },
        log: "Le dossier d'Avalh'ar n'est pas classé avec les visiteurs, mais avec les mesures de crise.",
        nextEventId: 'avalhar-archive',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 2 &&
          player.insight >= 5 &&
          (hasChoice(meta, 'seek-avalhar-archive') || hasTruth(meta, 'avalhar-name')),
      },
    ],
  },
  {
    id: 'avalhar-archive',
    title: "Le dossier d'Avalh'ar",
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'archmages-fell-to-thanatos')) {
        return `Le dossier confirme ce qu'Elian taisait. Les lettres de maître Avalh'ar décrivent Thanatos comme un homme capable de créer des Fractures et de désancrer les maîtres primordiaux.`;
      }

      return `Le dossier est incomplet. On y voit le portrait de l'Archimage du Temps, une note annonçant sa venue prochaine, et trois sceaux de confidentialité.`;
    },
    choices: [
      {
        id: 'read-avalhar-oath',
        label: "Lire le serment d'Avalh'ar",
        effect: { insight: 3, sanity: 4 },
        metaEffect: {
          discoveredTruths: ['avalhar-oath'],
        },
        log: "Avalh'ar théorise qu'un mage lié à la Fracture doit être drainé ou lié, jamais affronté de front.",
        nextEventId: 'bell-corridor',
      },
      {
        id: 'study-avalhar-seal',
        label: "Étudier le sceau d'Avalh'ar",
        effect: { insight: 4, corruption: 6, sanity: 4 },
        metaEffect: {
          discoveredTruths: ['avalhar-seal-fragment'],
          unlockedChoices: ['study-forgotten-seal'],
        },
        log: "Le sceau d'Avalh'ar ressemble au cercle oublié de l'aile nord.",
        nextEventId: 'forgotten-seal',
      },
      {
        id: 'read-ether-margin',
        label: 'Lire les marges interdites',
        effect: { insight: 2, sanity: 10 },
        metaEffect: {
          discoveredTruths: ['mana-remembers-observers'],
        },
        log: "Plus tu observes le temps, plus le mana instable apprend à reconnaître ta présence.",
        nextEventId: 'warning-courtyard',
      },
    ],
  },
  {
    id: 'bell-corridor',
    title: 'Couloir de midi',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'thanatos-invincible')) {
        return `À midi, le couloir paraît trop vivant. Tu sais que ces voix seront balayées en quelques heures, et cette connaissance pèse plus qu'une blessure.`;
      }

      return `À midi, le couloir central déborde de vie étudiante. On parle d'examens, de repas volés aux cuisines, de maîtres sévères.`;
    },
    choices: [
      {
        id: 'share-meal',
        label: 'Déjeuner avec les autres apprentis',
        effect: { sanity: -2, insight: 1 },
        metaEffect: {
          discoveredTruths: ['student-rumors'],
        },
        log: 'Les rumeurs des élèves dessinent des pistes fragiles.',
        nextEventId: 'warning-courtyard',
      },
      {
        id: 'follow-students',
        label: 'Suivre les élèves absents',
        effect: { insight: 2, sanity: 2 },
        metaEffect: {
          discoveredTruths: ['missing-students'],
        },
        log: 'Certains élèves quittent le trajet habituel avant la dernière cloche.',
        nextEventId: 'warning-courtyard',
      },
      {
        id: 'cross-crowd-by-force',
        label: 'Traverser la foule de force',
        effect: { hp: -3, sanity: 1, insight: 1 },
        metaEffect: {
          discoveredTruths: ['crowd-route'],
        },
        log: 'Tu gagnes quelques minutes en bousculant la foule, au prix de bleus et de regards furieux.',
        nextEventId: 'warning-courtyard',
      },
      {
        id: 'ask-about-avalhar-rumor',
        label: 'Suivre la rumeur du visiteur',
        effect: { insight: 2, sanity: 2 },
        metaEffect: {
          discoveredTruths: ['avalhar-name'],
        },
        log: "Les élèves ne connaissent qu'une rumeur de visite. Les maîtres, eux, murmurent le nom d'Avalh'ar.",
        nextEventId: 'open-archives',
        condition: (meta: MetaProgression): boolean =>
          hasTruth(meta, 'student-rumors') || hasTruth(meta, 'ethereal-archmages'),
      },
      {
        id: 'force-north-wing',
        label: "Forcer l'accès à l'aile nord",
        effect: { insight: 2, corruption: 7, sanity: 4 },
        metaEffect: {
          discoveredTruths: ['secret-timeline-cell'],
          unlockedChoices: ['study-forgotten-seal'],
        },
        log: 'La serrure temporelle cède, mais quelque chose te remarque.',
        nextEventId: 'restricted-wing',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 2 && player.insight >= 6 && hasTruth(meta, 'sealed-north-wing'),
      },
      {
        id: 'wait-for-attack',
        label: 'Attendre le massacre pour observer',
        effect: { sanity: 9, insight: 1 },
        log: 'Tu restes au centre de la cour, déjà hanté par ce qui arrive.',
        nextEventId: 'thanatos-arrival',
        condition: (meta: MetaProgression): boolean => hasTruth(meta, 'thanatos-invincible'),
      },
    ],
  },
  {
    id: 'warning-courtyard',
    title: 'Cour des cadrans',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'academy-routine')) {
        return `Les cadrans muraux ne donnent plus la même minute. Tu reconnais l'instant où la journée commence à dévier.`;
      }

      return `La cour des cadrans accueille les élèves entre deux cours. Les aiguilles décoratives tournent lentement, sans jamais être tout à fait synchrones.`;
    },
    choices: [
      {
        id: 'warn-friends',
        label: 'Prévenir quelques camarades',
        effect: { sanity: 6, insight: 1 },
        metaEffect: {
          discoveredTruths: ['warnings-change-nothing'],
        },
        log: 'Tes avertissements provoquent peur et confusion, mais ne sauvent personne.',
        nextEventId: 'thanatos-arrival',
      },
      {
        id: 'inspect-clocks',
        label: 'Observer les cadrans',
        effect: { insight: 3, sanity: 3 },
        metaEffect: {
          discoveredTruths: ['clock-drift'],
        },
        log: 'Les cadrans dérivent toujours avant l’arrivée de Thanatos.',
        nextEventId: 'thanatos-arrival',
      },
      {
        id: 'test-time-depth',
        label: 'Tester la profondeur du temps',
        effect: { insight: 3, sanity: 7, corruption: 4 },
        metaEffect: {
          discoveredTruths: ['time-resists-linearity'],
        },
        log: 'Les aiguilles ne tournent pas seulement autour du cadran. Elles plongent.',
        nextEventId: 'temporal-observatory',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 3 && player.insight >= 8 && hasTruth(meta, 'time-has-depth'),
      },
      {
        id: 'trace-routine',
        label: 'Reconstituer la fuite des maîtres',
        effect: { insight: 3, sanity: 4 },
        metaEffect: {
          discoveredTruths: ['masters-hidden-route'],
        },
        log: 'Les maîtres ne fuient pas au hasard. Ils protègent un passage.',
        nextEventId: 'restricted-wing',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 3 && player.insight >= 7 && hasTruth(meta, 'academy-routine'),
      },
    ],
  },
  {
    id: 'temporal-observatory',
    title: 'Observatoire temporel',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'mana-remembers-observers')) {
        return `Dans l'observatoire, les lentilles ne montrent pas l'avenir. Elles montrent les regards posés sur l'avenir. Certains sont les tiens. D'autres portent la signature mathématique des travaux d'Avalh'ar.`;
      }

      return `La coupole de l'observatoire est fermée depuis des années. Les lentilles y suspendent des poussières lumineuses qui ne tombent jamais.`;
    },
    choices: [
      {
        id: 'watch-possible-timelines',
        label: 'Observer les lignes possibles',
        effect: { insight: 4, sanity: 9 },
        metaEffect: {
          discoveredTruths: ['timelines-branch-under-pressure'],
        },
        log: "Tu vois l'académie détruite de plusieurs façons, mais toujours autour du même point de rupture.",
        nextEventId: 'thanatos-arrival',
      },
      {
        id: 'look-without-filter',
        label: 'Regarder sans filtre protecteur',
        effect: { hp: -5, insight: 5, sanity: 10, corruption: 5 },
        metaEffect: {
          discoveredTruths: ['raw-time-wounds'],
        },
        log: 'La lumière temporelle brûle ta peau et grave des images impossibles dans tes yeux.',
        nextEventId: 'thanatos-arrival',
      },
      {
        id: 'search-avalhar-signal',
        label: "Chercher les calculs d'Avalh'ar",
        effect: { insight: 3, corruption: 8 },
        metaEffect: {
          discoveredTruths: ['avalhar-anchor-theory'],
          unlockedChoices: ['bind-thanatos'],
        },
        log: "Les calculs d'Avalh'ar décrivent une ancre capable de guider une conscience prise dans un retour et de préparer un réceptacle.",
        nextEventId: 'forgotten-seal',
        condition: (meta: MetaProgression): boolean =>
          hasTruth(meta, 'avalhar-oath') || hasTruth(meta, 'avalhar-seal-fragment'),
      },
      {
        id: 'close-observatory',
        label: "Refermer l'observatoire",
        effect: { sanity: -2, insight: 1 },
        log: "Tu quittes la coupole avant qu'elle retienne ton reflet.",
        nextEventId: 'thanatos-arrival',
      },
    ],
  },
  {
    id: 'restricted-wing',
    title: 'Aile interdite',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'secret-timeline-cell')) {
        return `L'aile nord ne suit pas le plan de l'école. Certaines portes ouvrent sur des versions anciennes des mêmes salles, comme si l'académie avait gardé ses erreurs.`;
      }

      return `Derrière la porte scellée, l'académie change d'âge. La poussière est trop ancienne, les lampes trop neuves, et les murs portent des dates qui ne sont pas encore arrivées.`;
    },
    choices: [
      {
        id: 'read-threshold-notes',
        label: 'Lire les notes sur les seuils primordiaux',
        effect: { insight: 3, corruption: 10 },
        metaEffect: {
          discoveredTruths: ['primordial-thresholds'],
          unlockedChoices: ['resist-fracture'],
        },
        log: 'Les seuils primordiaux décrivent comment une conscience résiste aux anomalies temporelles.',
        nextEventId: 'forgotten-seal',
      },
      {
        id: 'listen-echoes',
        label: 'Écouter les Échos',
        effect: { insight: 3, sanity: 12 },
        metaEffect: {
          discoveredTruths: ['echoes-are-lost-minds'],
        },
        log: 'Les Échos répètent des choix que tu n’as pas encore faits.',
        nextEventId: 'forgotten-seal',
      },
      {
        id: 'touch-timeline-cell',
        label: 'Toucher la cellule temporelle',
        effect: { insight: 4, corruption: 18, sanity: 8 },
        metaEffect: {
          discoveredTruths: ['echo-vision'],
        },
        log: 'Tu vois une version de toi qui a cessé de chercher une sortie.',
        nextEventId: 'forgotten-seal',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.insight >= 10 && (player.loop >= 4 || hasTruth(meta, 'echoes-are-lost-minds')),
      },
      {
        id: 'break-ward-by-hand',
        label: 'Briser un verrou à mains nues',
        effect: { hp: -6, insight: 2, corruption: 4 },
        metaEffect: {
          discoveredTruths: ['wards-hurt-living-flesh'],
        },
        log: 'Le verrou cède en mordant ta paume jusqu’à l’os.',
        nextEventId: 'forgotten-seal',
      },
    ],
  },
  {
    id: 'forgotten-seal',
    title: 'Le sceau oublié',
    text: (meta: MetaProgression): string => {
      if (hasTruth(meta, 'primordial-thresholds')) {
        return `Le rituel n'a jamais promis de vaincre Thanatos. Il parle seulement d'ancrer une part de sa puissance dans une fissure stable, comme une esquisse de réceptacle.`;
      }

      return `Un cercle incomplet couvre le sol d'une salle verrouillée de l'intérieur. Les lignes semblent attendre une main qui les a déjà vues mourir.`;
    },
    choices: [
      {
        id: 'study-seal',
        label: 'Apprendre la structure du sceau',
        effect: { insight: 5, sanity: 8 },
        metaEffect: {
          discoveredTruths: ['thanatos-can-be-weakened'],
          unlockedChoices: ['bind-thanatos'],
        },
        log: 'Tu comprends comment contenir une part de sa puissance sans prétendre le vaincre.',
        nextEventId: 'thanatos-arrival',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 3 &&
          player.insight >= 10 &&
          (hasTruth(meta, 'primordial-thresholds') ||
            hasTruth(meta, 'temporal-fracture-pattern') ||
            hasTruth(meta, 'avalhar-seal-fragment') ||
            hasTruth(meta, 'avalhar-anchor-theory')),
      },
      {
        id: 'complete-avalhar-seal',
        label: "Compléter le sceau d'Avalh'ar",
        effect: { insight: 5, sanity: 10, corruption: 8 },
        metaEffect: {
          discoveredTruths: ['thanatos-can-be-weakened'],
          unlockedChoices: ['bind-thanatos'],
        },
        log: "Le sceau oublié n'était qu'une moitié. Les équations d'Avalh'ar suggèrent comment en faire un réceptacle temporaire.",
        nextEventId: 'thanatos-arrival',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 4 &&
          player.insight >= 12 &&
          hasTruth(meta, 'avalhar-seal-fragment') &&
          hasTruth(meta, 'time-resists-linearity'),
      },
      {
        id: 'touch-unstable-lines',
        label: 'Forcer les lignes instables',
        effect: { insight: 3, sanity: 16, corruption: 15 },
        metaEffect: {
          discoveredTruths: ['echo-vision'],
          unlockedChoices: ['open-to-thanatos'],
        },
        log: 'Le sceau répond, mais pas seulement à toi.',
        nextEventId: 'thanatos-arrival',
      },
      {
        id: 'refuse-ritual',
        label: 'Refermer la salle',
        effect: { sanity: -3, insight: 1 },
        log: 'Tu gagnes un instant de calme, mais pas de solution.',
        nextEventId: 'thanatos-arrival',
      },
    ],
  },
  {
    id: 'thanatos-arrival',
    title: "L'arrivée de Thanatos",
    text: (meta: MetaProgression): string => {
      const visits: number = seenCount(meta, 'thanatos-arrival');

      if (visits === 1) {
        return `La dernière cloche ne sonne pas. Le temps se fige. Une silhouette traverse les protections de l'académie, et maîtres comme élèves tombent en quelques instants.`;
      }

      if (hasTruth(meta, 'thanatos-can-be-weakened')) {
        return `Thanatos apparaît au même endroit, au même instant. Cette fois, tu vois la Fracture autour de lui. Elle ressemble moins à une armure qu'à une discipline poussée jusqu'au désastre.`;
      }

      if (hasTruth(meta, 'wards-delay-thanatos')) {
        return `Thanatos revient. Tu sais désormais qu'une barrière peut le retarder d'un souffle, jamais l'arrêter. Ce souffle pourrait pourtant suffire à tracer quelque chose.`;
      }

      if (hasTruth(meta, 'thanatos-breaks-spells')) {
        return `Thanatos revient. Ton contre-sort passé n'a servi à rien contre sa puissance, mais tu as senti sa magie se casser toujours au même angle.`;
      }

      return `Thanatos revient. Les morts se répètent, parfois dans un ordre différent, jamais assez différent. Sa violence a la précision d'un prodige humain devenu impossible à arrêter.`;
    },
    choices: [
      {
        id: 'observe-thanatos',
        label: 'Observer jusqu’au bout',
        effect: { hp: -999, insight: 3, sanity: 12 },
        metaEffect: {
          discoveredTruths: ['thanatos-invincible'],
        },
        log: 'Tu meurs en mémorisant le rythme du massacre.',
      },
      {
        id: 'protect-students',
        label: 'Protéger les élèves proches',
        effect: { hp: -999, sanity: 9, insight: 1 },
        metaEffect: {
          discoveredTruths: ['some-deaths-shift'],
        },
        log: 'Tu déplaces quelques morts, mais Thanatos reprend tout.',
      },
      {
        id: 'counter-thanatos-spell',
        label: 'Tenter de contrer son sort',
        effect: { hp: -12, insight: 3, sanity: 7 },
        metaEffect: {
          discoveredTruths: ['thanatos-breaks-spells'],
        },
        log: 'Ton contre-sort se brise avant de toucher Thanatos, mais tu sens l’angle de sa Fracture.',
        nextEventId: 'thanatos-arrival',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.insight >= 5 && (player.loop >= 2 || hasTruth(meta, 'flow-basics')),
      },
      {
        id: 'channel-protective-ward',
        label: 'Canaliser une barrière temporelle',
        effect: { hp: -8, corruption: 8, insight: 2 },
        metaEffect: {
          discoveredTruths: ['wards-delay-thanatos'],
        },
        log: 'La barrière retarde Thanatos d’un battement de cœur et te renvoie l’impact dans les côtes.',
        nextEventId: 'thanatos-arrival',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.insight >= 8 &&
          (hasTruth(meta, 'temporal-fracture-pattern') || hasTruth(meta, 'avalhar-seal-fragment')),
      },
      {
        id: 'strike-thanatos',
        label: 'Le frapper directement',
        effect: { hp: -999, sanity: 6 },
        metaEffect: {
          discoveredTruths: ['force-cannot-reach-thanatos'],
        },
        log: 'Ton attaque traverse une absence glacée. La réponse de Thanatos te tue avant la douleur.',
        condition: (meta: MetaProgression): boolean => hasTruth(meta, 'thanatos-invincible'),
      },
      {
        id: 'bind-thanatos',
        label: 'Tracer le sceau oublié',
        effect: { sanity: 12, corruption: 20 },
        metaEffect: {
          endingsSeen: ['thanatos-weakened'],
        },
        log: 'Le sceau accroche la Fracture qui entoure Thanatos. Pour la première fois, une part de sa puissance se laisse tirer hors de lui.',
        nextEventId: 'partial-seal',
        condition: (meta: MetaProgression, player: Player): boolean =>
          player.loop >= 4 &&
          hasChoice(meta, 'bind-thanatos') &&
          hasTruth(meta, 'thanatos-can-be-weakened') &&
          player.insight >= 12,
      },
      {
        id: 'open-to-thanatos',
        label: 'Ouvrir la Fracture en toi',
        effect: { corruption: 100, insight: 2 },
        metaEffect: {
          endingsSeen: ['thanatos-strengthened'],
        },
        log: 'Tu cesses de résister. La Fracture répond à travers toi.',
        condition: (meta: MetaProgression, player: Player): boolean =>
          hasChoice(meta, 'open-to-thanatos') ||
          player.corruption >= 35 ||
          hasTruth(meta, 'primordial-thresholds') ||
          hasTruth(meta, 'echo-vision'),
      },
    ],
  },
  {
    id: 'partial-seal',
    title: 'La Fracture contenue',
    text: (): string =>
      `Le cercle ne sauve pas l'académie. Pas entièrement. Mais une part de la puissance de Thanatos reste prise dans la fissure, comme si le monde apprenait pour la première fois à le drainer.`,
    choices: [
      {
        id: 'hold-seal',
        label: 'Tenir le sceau',
        effect: { hp: -999, sanity: 14, corruption: 10 },
        metaEffect: {
          endingsSeen: ['academy-prequel-complete'],
        },
        log: "Tu transmets malgré toi l'idée du réceptacle qui limitera un jour l'influence de Thanatos.",
      },
    ],
  },
];

export const ERRANT_DU_TEMPS_SCENARIO: ScenarioDefinition = {
  id: 'errant-du-temps',
  events: ERRANT_DU_TEMPS_EVENTS,
  startEventId: 'academy-day',
  loopEventId: 'academy-day',
  firstStartLog: "Une journée à l'académie commence.",
  repeatStartLog: 'Quelque chose recommence.',
  intro: {
    kicker: 'Chronique interactive',
    title: 'Errant du Temps',
    location: "Academie d'Astrance",
    heading: "Une journée commence à l'académie.",
    text: "Les couloirs sont calmes, presque trop. Entre les cours, les recherches et les rumeurs, quelque chose semble attendre d'etre remarque.",
  },
  getSceneLabel: (meta: MetaProgression): string => {
    const loops: number = meta.seenEvents['academy-day'] ?? 0;

    if (loops <= 1) {
      return "Academie d'Astrance";
    }

    return `Retour ${loops}`;
  },
};
