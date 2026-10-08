/**
 * AP State Board (SCERT Andhra Pradesh) Class IX Mathematics tables.
 * Section titles and numbering transcribed from:
 *   9_Maths_SEM-1_Textbook.pdf  (Semester 1, Chapters 1-6)
 *   9_Maths_SEM-2_Textbook.pdf  (Semester 2, Chapters 7-12)
 *
 * DATA ONLY - run `node scripts/build-all.mjs` to regenerate
 * src/lib/curriculum/ap-state-board-seed.ts
 */

export const AP_CHAPTERS = [
// =========================================== SEMESTER 1 : CHAPTER 1 =====
  {
    comment: 'AP SEM 1 : CHAPTER 1',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s1-number-systems',
    chapterNumber: 1,
    title: 'Number Systems',
    titleTelugu: 'సంఖ్య వ్యవస్థలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 1, Chapter 1 (sections 1.1 - 1.6). Irrational numbers, real numbers and their decimal expansions, operations on real numbers, and the laws of exponents for real numbers.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-1, అధ్యాయం 1 (1.1 - 1.6). అకరణీయ సంఖ్యలు, వాస్తవ సంఖ్యలు మరియు వాటి దశాంశ రూపాలు, వాస్తవ సంఖ్యలపై ప్రకారాలు మరియు ఘాతాల లక్షణాలు.',
    estimatedHours: 14,
    iconName: 'Hash',
    unitNumber: 1,
    unitLabel: 'Semester 1',
    unitLabelTelugu: 'సెమెస్టర్ 1',
    curriculumSource: 'SCERT AP Class IX Maths Semester 1 - Chapter 1: Number Systems (1.1 - 1.6)',
    learningOutcomes: [
      'Understand irrational numbers and their existence.',
      'Understand the decimal representation of real numbers.',
      'Apply the operations on real numbers.',
      'Apply the laws of exponents for real numbers.',
    ],
    learningOutcomesTelugu: [
      'అకరణీయ సంఖ్యలు మరియు వాటి అభివృత్వాన్ని అర్థం చేసుకోవడం.',
      'వాస్తవ సంఖ్యల దశాంశ రూపాన్ని అర్థం చేసుకోవడం.',
      'వాస్తవ సంఖ్యలపై ప్రకారాలను వర్తించడం.',
      'వాస్తవ సంఖ్యల ఘాతాల లక్షణాలను వర్తించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s1-ns-intro',
        sectionRef: '1.1',
        title: 'Introduction',
        titleTelugu: 'పరిచయం',
        description:
          'Revises the number line and shows that beyond the rational numbers there are numbers that cannot be expressed as p/q.',
        descriptionTelugu:
          'సంఖ్య రేఖను పునఃఅధ్యయనం చేసి, సామాన్య సంఖ్యలకు దాదాపు పరిధిలో p/q రూపంలో రాయలేని సంఖ్యలు ఉన్నాయని చూపుతుంది.',
        concepts: [
          'The number line represents natural numbers, integers and rationals.',
          'Not every point on the number line is a rational number.',
          'These remaining points are the irrational numbers.',
        ],
        conceptsTelugu: [
          'సంఖ్య రేఖ సహజ సంఖ్యలు, పూర్ణ సంఖ్యలు, సామాన్య సంఖ్యలను సూచిస్తుంది.',
          'సంఖ్య రేఖపైని ప్రతి బిందువు సామాన్య సంఖ్య కాదు.',
          'మిగిలిన ఆ బిందువులే అకరణీయ సంఖ్యలు.',
        ],
        learningObjectives: ['Explain why irrational numbers are needed.'],
        learningObjectivesTelugu: ['అకరణీయ సంఖ్యలు ఎందుకు అవసరమో వివరించడం.'],
      },
      {
        id: 'top-ap-s1-ns-irrational',
        sectionRef: '1.2',
        title: 'Irrational Numbers',
        titleTelugu: 'అకరణీయ సంఖ్యలు',
        description:
          'A number that cannot be written as p/q with integers p, q (q != 0) is irrational. Establishes their existence using √2.',
        descriptionTelugu:
          'పూర్ణ సంఖ్యల p, q (q ≠ 0) తో p/q రూపంలో రాయలేని సంఖ్య అకరణీయ సంఖ్య. √2 ఉపయోగించి వాటి అభివృత్వాన్ని నిరూపిస్తుంది.',
        concepts: [
          'Irrational numbers exist because √2 is irrational.',
          'Between two rational numbers there is always an irrational number.',
          'Between two irrational numbers there is always a rational number.',
        ],
        conceptsTelugu: [
          '√2 అకరణీయం కాబట్టి అకరణీయ సంఖ్యలు అభివృత్వంలో ఉంటాయి.',
          'రెండు సామాన్య సంఖ్యల మధ్య ఇప్పుడు ఒక అకరణీయ సంఖ్య ఉంటుంది.',
          'రెండు అకరణీయ సంఖ్యల మధ్య ఇప్పుడు ఒక సామాన్య సంఖ్య ఉంటుంది.',
        ],
        learningObjectives: ['Define irrational numbers and prove √2 is irrational.'],
        learningObjectivesTelugu: ['అకరణీయ సంఖ్యలను నిర్వచించి √2 అకరణీయమని నిరూపించడం.'],
      },
      {
        id: 'top-ap-s1-ns-decimal',
        sectionRef: '1.3',
        title: 'Real Numbers and their Decimal Expansions',
        titleTelugu: 'వాస్తవ సంఖ్యలు మరియు వాటి దశాంశ రూపాలు',
        description:
          'A rational number has a terminating or a recurring decimal expansion, while an irrational number has a non-terminating non-recurring decimal expansion.',
        descriptionTelugu:
          'సామాన్య సంఖ్యకు అంత్యమయ్యే లేదా పునరావృతమయ్యే దశాంశ రూపం ఉంటుంది, అకరణీయ సంఖ్యకు అంత్యం కాని పునరావృతం కాని దశాంశ రూపం ఉంటుంది.',
        concepts: [
          'A rational number has either a terminating or a recurring decimal expansion.',
          'An irrational number has a non-terminating non-recurring decimal expansion.',
          'This difference is how we tell rationals and irrationals apart.',
        ],
        conceptsTelugu: [
          'సామాన్య సంఖ్యకు అంత్యమయ్యే లేదా పునరావృతమయ్యే దశాంశ రూపం ఉంటుంది.',
          'అకరణీయ సంఖ్యకు అంత్యం కాని పునరావృతం కాని దశాంశ రూపం ఉంటుంది.',
          'ఈ తేడాతో సామాన్య, అకరణీయ సంఖ్యలను గుర్తించగలుగుతాం.',
        ],
        learningObjectives: ['Compare the decimal expansions of rational and irrational numbers.'],
        learningObjectivesTelugu: ['సామాన్య, అకరణీయ సంఖ్యల దశాంశ రూపాలను పోల్చడం.'],
      },
      {
        id: 'top-ap-s1-ns-operations',
        sectionRef: '1.4',
        title: 'Operations on Real Numbers',
        titleTelugu: 'వాస్తవ సంఖ్యలపై ప్రకారాలు',
        description:
          'Closure and other properties of real numbers, plus the rules for rationalising the denominator of a surd.',
        descriptionTelugu:
          'వాస్తవ సంఖ్యల మూసివేలను ఇతర గుణాలు మరియు వర్గమూల హారాన్ని సామాన్యీకరించే నియమాలు.',
        concepts: [
          'The sum or product of two real numbers is a real number.',
          '√2 + √3 is irrational, but √2 x √2 = 2 is rational.',
          'Rationalise the denominator, e.g. 1/√2 = √2/2.',
        ],
        conceptsTelugu: [
          'రెండు వాస్తవ సంఖ్యల మొత్తం లేదా గుణకారం వాస్తవ సంఖ్యే.',
          '√2 + √3 అకరణీయం, కానీ √2 x √2 = 2 సామాన్యం.',
          'హారాన్ని సామాన్యీకరించడం, ఉదా. 1/√2 = √2/2.',
        ],
        learningObjectives: ['Apply operations on real numbers and rationalise denominators.'],
        learningObjectivesTelugu: ['వాస్తవ సంఖ్యలపై ప్రకారాలను వర్తించి హారాలను సామాన్యీకరించడం.'],
        formulas: [
          {
            title: 'Rationalising the denominator',
            titleTelugu: 'హారాన్ని సామాన్యీకరించడం',
            latex: '\\frac{1}{\\sqrt{a}} = \\frac{\\sqrt{a}}{a}',
            description: 'Multiply numerator and denominator by √a to remove the surd from the denominator.',
            descriptionTelugu: 'హారంలోని వర్గమూలాన్ని తొలగించడానికి హారం, సంఖ్యలను √a తో గుణిస్తారు.',
            variables: [{ symbol: 'a', meaning: 'a positive number' }],
          },
        ],
      },
      {
        id: 'top-ap-s1-ns-exponents',
        sectionRef: '1.5',
        title: 'Laws of Exponents for Real Numbers',
        titleTelugu: 'వాస్తవ సంఖ్యల ఘాతాల లక్షణాలు',
        description:
          'The laws of exponents applied to real numbers, including rational and irrational exponents such as √a = a^(1/2).',
        descriptionTelugu:
          'వాస్తవ సంఖ్యలకు ఘాతాల లక్షణాలను వర్తించడం, సామాన్య మరియు అకరణీయ ఘాతాలు ఉదా. √a = a^(1/2).',
        concepts: [
          'a^m x a^n = a^(m + n) and a^m / a^n = a^(m - n).',
          '(a^m)^n = a^(mn) and (ab)^n = a^n x b^n.',
          'a^(1/n) is the nth root of a, so √a = a^(1/2).',
        ],
        conceptsTelugu: [
          'a^m x a^n = a^(m + n) మరియు a^m / a^n = a^(m - n).',
          '(a^m)^n = a^(mn) మరియు (ab)^n = a^n x b^n.',
          'a^(1/n) అంటే a యొక్క nవ వర్గమూలం, కాబట్టి √a = a^(1/2).',
        ],
        learningObjectives: ['Apply the laws of exponents to real numbers.'],
        learningObjectivesTelugu: ['వాస్తవ సంఖ్యలకు ఘాతాల లక్షణాలను వర్తించడం.'],
        formulas: [
          {
            title: 'Product of like powers',
            titleTelugu: 'ఒకే ఘాతాల గుణకారం',
            latex: 'a^m \\cdot a^n = a^{m+n}',
            description: 'Multiplying powers of the same base adds the exponents.',
            descriptionTelugu: 'ఒకే పాతిపై ఘాతాలను గుణిస్తే ఘాతాలు కూడుతాయి.',
            variables: [
              { symbol: 'a', meaning: 'the common base' },
              { symbol: 'm, n', meaning: 'the exponents' },
            ],
          },
          {
            title: 'Square root as a fractional power',
            titleTelugu: 'వర్గమూలం భిన్న ఘాతంగా',
            latex: '\\sqrt{a} = a^{1/2}',
            description: 'The square root of a is a to the power one half.',
            descriptionTelugu: 'a వర్గమూలం అంటే a యొక్క అర్ధ ఘాతం.',
            variables: [{ symbol: 'a', meaning: 'a non-negative number' }],
          },
        ],
      },
      {
        id: 'top-ap-s1-ns-summary',
        sectionRef: '1.6',
        title: 'Chapter 1 Summary',
        titleTelugu: 'అధ్యాయం 1 సారాంశం',
        description:
          'Key results of Chapter 1: existence of irrational numbers, decimal expansions, operations on real numbers and the laws of exponents.',
        descriptionTelugu:
          'అధ్యాయం 1 ప్రధాన ఫలితాలు: అకరణీయ సంఖ్యల అభివృత్వం, దశాంశ రూపాలు, వాస్తవ సంఖ్యలపై ప్రకారాలు మరియు ఘాతాల లక్షణాలు.',
        concepts: [
          'Revise the existence of irrational numbers and their decimal expansions.',
          'Practise rationalising denominators and applying exponent laws.',
        ],
        conceptsTelugu: [
          'అకరణీయ సంఖ్యల అభివృత్వం మరియు వాటి దశాంశ రూపాలను పునఃపరిశీలించడం.',
          'హారాలను సామాన్యీకరించడం మరియు ఘాతాల లక్షణాలను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 1.'],
        learningObjectivesTelugu: ['అధ్యాయం 1 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 1 : CHAPTER 2 =====================
  {
    comment: 'AP SEM 1 : CHAPTER 2',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s1-polynomials',
    chapterNumber: 2,
    title: 'Polynomials',
    titleTelugu: 'బహుపదులు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 1, Chapter 2 (sections 2.1 - 2.6). Polynomials in one variable, zeroes of a polynomial, the remainder and factor theorems, factorisation and algebraic identities.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-1, అధ్యాయం 2 (2.1 - 2.6). ఒక విభిన్నంలో బహుపదులు, బహుపది శూన్యాలు, భాగశేషం మరియు కారణాంక సిద్ధాంతాలు, కారణాంకీకరణ మరియు బహుజ్ఞ సమీకరణాలు.',
    estimatedHours: 16,
    iconName: 'Variable',
    unitNumber: 1,
    unitLabel: 'Semester 1',
    unitLabelTelugu: 'సెమెస్టర్ 1',
    curriculumSource: 'SCERT AP Class IX Maths Semester 1 - Chapter 2: Polynomials (2.1 - 2.6)',
    learningOutcomes: [
      'Work with polynomials in one variable.',
      'Find the zeroes of a polynomial.',
      'Apply the remainder and factor theorems.',
      'Factorise algebraic expressions using identities.',
    ],
    learningOutcomesTelugu: [
      'ఒక విభిన్నంలో బహుపదులతో పని చేయడం.',
      'బహుపది శూన్యాలను కనుగొనడం.',
      'భాగశేషం మరియు కారణాంక సిద్ధాంతాలను వర్తించడం.',
      'సమీకరణాలను ఉపయోగించి బహుజ్ఞ వ్యక్తులను కారణాంకీకరించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s1-poly-intro',
        sectionRef: '2.1 - 2.2',
        title: 'Introduction; Polynomials in One Variable',
        titleTelugu: 'పరిచయం; ఒక విభిన్నంలో బహుపదులు',
        description:
          'Revises algebraic expressions and constants, and introduces a polynomial in one variable together with its degree and standard form.',
        descriptionTelugu:
          'బహుజ్ఞ పదాలు మరియు స్థిరీలను పునఃఅధ్యయనం చేసి, ఒక విభిన్నంలో బహుపది, దాని డిగ్రీ మరియు ప్రామాణిక రూపాన్ని పరిచయం చేస్తుంది.',
        concepts: [
          'A polynomial is formed from variables and constants using addition, subtraction and multiplication.',
          'The degree of a polynomial is the highest power of the variable.',
          'A monomial has one term and a binomial has two terms.',
        ],
        conceptsTelugu: [
          'బహుపది విభిన్నాలు మరియు స్థిరీలతో జోడించడం, తీసివేయడం, గుణకారంతో ఏర్పడుతుంది.',
          'బహుపది డిగ్రీ అంటే విభిన్నం యొక్క అత్యధిక ఘాతం.',
          'ఏకపదానికి ఒక పదం, ద్విపదానికి రెండు పదాలు ఉంటాయి.',
        ],
        learningObjectives: ['Define a polynomial and identify its degree.'],
        learningObjectivesTelugu: ['బహుపదిని నిర్వచించి దాని డిగ్రీని గుర్తించడం.'],
      },
      {
        id: 'top-ap-s1-poly-zero',
        sectionRef: '2.3',
        title: 'Zeroes of a Polynomial',
        titleTelugu: 'బహుపది శూన్యాలు',
        description:
          'A real number k is a zero of p(x) if p(k) = 0. The zeroes of a polynomial can be read off from its graph.',
        descriptionTelugu:
          'వాస్తవ సంఖ్య k అనేది p(k) = 0 అయితే p(x) యొక్క శూన్యం. బహుపది గ్రాఫ్ నుంచి దాని శూన్యాలను చదవవచ్చు.',
        concepts: [
          'p(k) = 0 means the point (k, 0) lies on the graph of p(x).',
          'x - k is a factor of p(x) when k is a zero.',
          'Every real polynomial of odd degree has at least one real zero.',
        ],
        conceptsTelugu: [
          'p(k) = 0 అంటే (k, 0) బిందువు p(x) గ్రాఫ్ పై ఉంటుంది.',
          'k ఒక శూన్యమైతే x - k అనేది p(x) కు కారణాంకం.',
          'విషమ డిగ్రీ గల ప్రతి వాస్తవ బహుపదికీ ఒక వాస్తవ శూన్యం ఉంటుంది.',
        ],
        learningObjectives: ['Find the zeroes of a given polynomial.'],
        learningObjectivesTelugu: ['ఇచ్చిన బహుపది శూన్యాలను కనుగొనడం.'],
      },
      {
        id: 'top-ap-s1-poly-factor',
        sectionRef: '2.4',
        title: 'Factorisation of Polynomials',
        titleTelugu: 'బహుపదుల కారణాంకీకరణ',
        description:
          'Division of polynomials by the remainder and factor theorems, and using them to factorise expressions.',
        descriptionTelugu:
          'బహుపదులను భాగశేషం మరియు కారణాంక సిద్ధాంతాలతో భాగిస్తూ వ్యక్తులను కారణాంకీకరించడం.',
        concepts: [
          'Remainder theorem: dividing p(x) by (x - a) leaves remainder p(a).',
          'Factor theorem: (x - a) is a factor of p(x) exactly when p(a) = 0.',
          'A zero k of p(x) gives the factor (x - k).',
        ],
        conceptsTelugu: [
          'భాగశేషం సిద్ధాంతం: p(x) ను (x - a) తో భాగిస్తే భాగశేషం p(a) ఉంటుంది.',
          'కారణాంక సిద్ధాంతం: p(a) = 0 అయితే మాత్రమే (x - a) కారణాంకం అవుతుంది.',
          'p(x) యొక్క శూన్యం k కు కారణాంకం (x - k).',
        ],
        learningObjectives: ['Apply the remainder and factor theorems to factorise polynomials.'],
        learningObjectivesTelugu: ['భాగశేషం మరియు కారణాంక సిద్ధాంతాలతో బహుపదులను కారణాంకీకరించడం.'],
        workedExample: {
          question: 'Which of these is a factor of x^2 - 5x + 6?',
          questionTelugu: 'వీటిలో ఏది x^2 - 5x + 6 కు కారణాంకం?',
          steps: [
            { explanation: 'Test possible integer zeroes using the factor theorem.' },
            { explanation: 'p(2) = 4 - 10 + 6 = 0, so 2 is a zero.', latex: 'p(2) = 0' },
            { explanation: 'Dividing gives the other factor x - 3.', latex: 'x^2 - 5x + 6 = (x - 2)(x - 3)' },
          ],
          finalAnswer: '(x - 2)(x - 3), so x - 2 and x - 3 are factors.',
        },
      },
      {
        id: 'top-ap-s1-poly-identity',
        sectionRef: '2.5',
        title: 'Algebraic Identities',
        titleTelugu: 'బహుజ్ఞ సమీకరణాలు',
        description:
          'Standard identities for the sum and difference of two squares and for the product of two binomials.',
        descriptionTelugu:
          'రెండు వర్గాల మొత్తం, తేడాకు, మరియు రెండు ద్విపదాల గుణకారానికి ప్రామాణిక బహుజ్ఞ సమీకరణాలు.',
        concepts: [
          '(a + b)^2 = a^2 + 2ab + b^2',
          '(a - b)^2 = a^2 - 2ab + b^2',
          'A^2 - B^2 = (A + B)(A - B)',
        ],
        conceptsTelugu: [
          '(a + b)^2 = a^2 + 2ab + b^2',
          '(a - b)^2 = a^2 - 2ab + b^2',
          'A^2 - B^2 = (A + B)(A - B)',
        ],
        learningObjectives: ['Use standard identities to expand and factorise expressions.'],
        learningObjectivesTelugu: ['ప్రామాణిక సమీకరణాలతో వ్యక్తులను విస్తరించి కారణాంకీకరించడం.'],
        formulas: [
          {
            title: 'Square of a sum',
            titleTelugu: 'మొత్తం వర్గం',
            latex: '(a + b)^2 = a^2 + 2ab + b^2',
            description: 'Expanding (a + b) squared gives a^2 + 2ab + b^2.',
            descriptionTelugu: '(a + b) వర్గాన్ని విస్తరించగా a^2 + 2ab + b^2 లభిస్తుంది.',
            variables: [
              { symbol: 'a', meaning: 'first term' },
              { symbol: 'b', meaning: 'second term' },
            ],
          },
          {
            title: 'Difference of two squares',
            titleTelugu: 'రెండు వర్గాల తేడా',
            latex: 'A^2 - B^2 = (A + B)(A - B)',
            description: 'Used to factorise the difference of two squares.',
            descriptionTelugu: 'రెండు వర్గాల తేడాను కారణాంకీకరించడానికి ఉపయోగిస్తారు.',
            variables: [
              { symbol: 'A', meaning: 'first expression' },
              { symbol: 'B', meaning: 'second expression' },
            ],
          },
        ],
        workedExample: {
          question: 'Simplify (x + 5)(x - 5).',
          questionTelugu: '(x + 5)(x - 5) ను సరళీకరించండి.',
          steps: [
            { explanation: 'Recognise the pattern (A + B)(A - B) with A = x and B = 5.' },
            { explanation: 'Apply the difference of squares identity.', latex: 'x^2 - 5^2' },
            { explanation: 'Substitute the value.', latex: 'x^2 - 25' },
          ],
          finalAnswer: 'x^2 - 25.',
        },
      },
      {
        id: 'top-ap-s1-poly-summary',
        sectionRef: '2.6',
        title: 'Chapter 2 Summary',
        titleTelugu: 'అధ్యాయం 2 సారాంశం',
        description:
          'Key results of Chapter 2: zeroes, the factor and remainder theorems, and the standard identities.',
        descriptionTelugu:
          'అధ్యాయం 2 ప్రధాన ఫలితాలు: శూన్యాలు, కారణాంక మరియు భాగశేషం సిద్ధాంతాలు, ప్రామాణిక సమీకరణాలు.',
        concepts: [
          'Review the zeroes and graphs of the given polynomials.',
          'Revise the factor and remainder theorems.',
          'Practise the standard identities.',
        ],
        conceptsTelugu: [
          'ఇచ్చిన బహుపదుల శూన్యాలు మరియు గ్రాఫ్‌లను పునఃపరిశీలించడం.',
          'కారణాంక మరియు భాగశేషం సిద్ధాంతాలను పునఃపరిశీలించడం.',
          'ప్రామాణిక సమీకరణాలను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 2.'],
        learningObjectivesTelugu: ['అధ్యాయం 2 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 1 : CHAPTER 3 =====================
  {
    comment: 'AP SEM 1 : CHAPTER 3',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s1-coordinate-geometry',
    chapterNumber: 3,
    title: 'Co-ordinate Geometry',
    titleTelugu: 'నిర్దేశ సమీకరణ జ్యామితి',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 1, Chapter 3 (sections 3.1 - 3.3). Cartesian plane, plotting points, and the graphical representation of a linear equation.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-1, అధ్యాయం 3 (3.1 - 3.3). కార్టీసియన్ తలం, బిందువులు గీయడం మరియు రేఖీయ సమీకరణం గ్రాఫ్ రూపం.',
    estimatedHours: 10,
    iconName: 'Compass',
    unitNumber: 1,
    unitLabel: 'Semester 1',
    unitLabelTelugu: 'సెమెస్టర్ 1',
    curriculumSource: 'SCERT AP Class IX Maths Semester 1 - Chapter 3: Co-ordinate Geometry (3.1 - 3.3)',
    learningOutcomes: [
      'Understand the Cartesian plane and the two axes.',
      'Plot points using coordinates.',
      'Represent a linear equation graphically.',
    ],
    learningOutcomesTelugu: [
      'కార్టీసియన్ తలం మరియు రెండు అక్షాలను అర్థం చేసుకోవడం.',
      'నిర్దేశాలను ఉపయోగించి బిందువులను గీయడం.',
      'రేఖీయ సమీకరణాన్ని గ్రాఫ్ రూపంలో సూచించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s1-cg-intro',
        sectionRef: '3.1',
        title: 'Introduction',
        titleTelugu: 'పరిచయం',
        description:
          'Introduces the Cartesian plane, formed by two perpendicular number lines called axes, together with the position of a point.',
        descriptionTelugu:
          'అక్షాలు అనే రెండు పరస్పర లంబ సంఖ్య రేఖలతో ఏర్పడే కార్టీసియన్ తలాన్ని మరియు బిందువు స్థానాన్ని పరిచయం చేస్తుంది.',
        concepts: [
          'The Cartesian plane has two perpendicular axes.',
          'x-axis is horizontal and y-axis is vertical.',
          'The origin O is the point where the two axes meet.',
        ],
        conceptsTelugu: [
          'కార్టీసియన్ తలంలో రెండు పరస్పర లంబ అక్షాలు ఉంటాయి.',
          'x-అక్షం ఆడమేమి మరియు y-అక్షం నిలువు.',
          'మూలబిందువు O రెండు అక్షాలు కలిసే బిందువు.',
        ],
        learningObjectives: ['Describe the Cartesian plane.'],
        learningObjectivesTelugu: ['కార్టీసియన్ తలాన్ని వివరించడం.'],
      },
      {
        id: 'top-ap-s1-cg-cartesian',
        sectionRef: '3.2',
        title: 'Cartesian System',
        titleTelugu: 'కార్టీసియన్ వ్యవస్థ',
        description:
          'Locating points on the plane with coordinates, and plotting points in the four quadrants.',
        descriptionTelugu:
          'నిర్దేశాలతో తలంపై బిందువుల స్థానాన్ని గుర్తించడం మరియు నాలుగు పరిశీలనాల్లో బిందువులను గీయడం.',
        concepts: [
          'A point is written as (x, y) giving distances from both axes.',
          'Signs of x and y decide the quadrant.',
          'Points on an axis have one coordinate equal to zero.',
        ],
        conceptsTelugu: [
          'బిందువు (x, y) రూపంలో రెండు అక్షాల నుంచి దూరాలను ఇస్తుంది.',
          'x, y గుణుల గుణాంకాలు పరిశీలనాన్ని నిర్ణయిస్తాయి.',
          'అక్షంపైని బిందువులో ఒక నిర్దేశం సున్నా.',
        ],
        learningObjectives: ['Plot points using coordinates.'],
        learningObjectivesTelugu: ['నిర్దేశాలను ఉపయోగించి బిందువులను గీయడం.'],
        workedExample: {
          question: 'In which quadrant does the point (-3, 5) lie?',
          questionTelugu: '(-3, 5) బిందువు ఏ పరిశీలనంలో ఉంటుంది?',
          steps: [
            { explanation: 'The x-coordinate -3 is negative, so the point is left of the y-axis.' },
            { explanation: 'The y-coordinate 5 is positive, so the point is above the x-axis.' },
          ],
          finalAnswer: 'The point lies in the second quadrant.',
        },
      },
      {
        id: 'top-ap-s1-cg-summary',
        sectionRef: '3.3',
        title: 'Chapter 3 Summary',
        titleTelugu: 'అధ్యాయం 3 సారాంశం',
        description:
          'Key results of Chapter 3: the Cartesian plane, quadrants and plotting points with coordinates.',
        descriptionTelugu:
          'అధ్యాయం 3 ప్రధాన ఫలితాలు: కార్టీసియన్ తలం, పరిశీలనాలు మరియు నిర్దేశాలతో బిందువులు గీయడం.',
        concepts: [
          'Revise the axes, origin and quadrants.',
          'Practise plotting points from their coordinates.',
        ],
        conceptsTelugu: [
          'అక్షాలు, మూలబిందువు మరియు పరిశీలనాలను పునఃపరిశీలించడం.',
          'నిర్దేశాల నుంచి బిందువులను గీయడం సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 3.'],
        learningObjectivesTelugu: ['అధ్యాయం 3 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 1 : CHAPTER 4 =====================
  {
    comment: 'AP SEM 1 : CHAPTER 4',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s1-linear-equations',
    chapterNumber: 4,
    title: 'Linear Equations in Two Variables',
    titleTelugu: 'రెండు విభిన్నాలలోని రేఖీయ సమీకరణాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 1, Chapter 4 (sections 4.1 - 4.4). Linear equations, solution of a linear equation, and the graph of a linear equation.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-1, అధ్యాయం 4 (4.1 - 4.4). రేఖీయ సమీకరణాలు, రేఖీయ సమీకరణ పరిష్కారం మరియు రేఖీయ సమీకరణం గ్రాఫ్.',
    estimatedHours: 14,
    iconName: 'Grid',
    unitNumber: 1,
    unitLabel: 'Semester 1',
    unitLabelTelugu: 'సెమెస్టర్ 1',
    curriculumSource: 'SCERT AP Class IX Maths Semester 1 - Chapter 4: Linear Equations in Two Variables (4.1 - 4.4)',
    learningOutcomes: [
      'Understand linear equations in two variables.',
      'Find solutions of a linear equation.',
      'Graph a linear equation in two variables.',
    ],
    learningOutcomesTelugu: [
      'రెండు విభిన్నాలలోని రేఖీయ సమీకరణాలను అర్థం చేసుకోవడం.',
      'రేఖీయ సమీకరణ పరిష్కారాలను కనుగొనడం.',
      'రెండు విభిన్నాలలోని రేఖీయ సమీకరణాన్ని గ్రాఫ్ రూపంలో గీయడం.',
    ],
    topics: [
      {
        id: 'top-ap-s1-leq-intro',
        sectionRef: '4.1',
        title: 'Introduction',
        titleTelugu: 'పరిచయం',
        description:
          'Introduces equations in two variables through practical situations such as the number of boys and girls in a class.',
        descriptionTelugu:
          'ఒక తరగతిలోని బాలురు, బాలికల సంఖ్య వంటి వాస్తవ స్థితుల ద్వారా రెండు విభిన్నాల సమీకరణాలను పరిచయం చేస్తుంది.',
        concepts: [
          'An equation in two variables has two unknown quantities.',
          'Real situations are expressed as such equations.',
          'Every solution must satisfy both unknowns together.',
        ],
        conceptsTelugu: [
          'రెండు విభిన్నాల సమీకరణంలో రెండు తెలియని పరిమాణాలు ఉంటాయి.',
          'వాస్తవ స్థితులను ఇలాంటి సమీకరణాలుగా రాస్తారు.',
          'ప్రతి పరిష్కారం రెండు విభిన్నాలను కలిసి తీర్చేలా ఉండాలి.',
        ],
        learningObjectives: ['Understand linear equations in two variables.'],
        learningObjectivesTelugu: ['రెండు విభిన్నాలలోని రేఖీయ సమీకరణాలను అర్థం చేసుకోవడం.'],
      },
      {
        id: 'top-ap-s1-leq-linear',
        sectionRef: '4.2',
        title: 'Linear Equations',
        titleTelugu: 'రేఖీయ సమీకరణాలు',
        description:
          'An equation of the form ax + by = c is linear, and each solution is an ordered pair.',
        descriptionTelugu:
          'ax + by = c రూపంలోని సమీకరణం రేఖీయం, మరియు ప్రతి పరిష్కారం ఒక క్రమ జత.',
        concepts: [
          'A linear equation in two variables has the form ax + by = c.',
          'Solutions are ordered pairs (x, y).',
          'There are infinitely many solutions.',
        ],
        conceptsTelugu: [
          'రెండు విభిన్నాలలోని రేఖీయ సమీకరణం ax + by = c రూపంలో ఉంటుంది.',
          'పరిష్కారాలు క్రమ జతలు (x, y).',
          'అనంతం పరిష్కారాలు ఉంటాయి.',
        ],
        learningObjectives: ['Identify solutions of a linear equation.'],
        learningObjectivesTelugu: ['రేఖీయ సమీకరణ పరిష్కారాలను గుర్తించడం.'],
        workedExample: {
          question: 'Check whether (2, 3) satisfies x + 2y = 8.',
          questionTelugu: '(2, 3) జత x + 2y = 8 ను తీర్చుతుందో పరిశీలించండి.',
          steps: [
            { explanation: 'Substitute x = 2 and y = 3 into the left-hand side.', latex: '2 + 2(3)' },
            { explanation: 'Compute the value.', latex: '2 + 6 = 8' },
            { explanation: 'Compare with the right-hand side, which is also 8.' },
          ],
          finalAnswer: 'Yes, (2, 3) satisfies the equation.',
        },
      },
      {
        id: 'top-ap-s1-leq-solution',
        sectionRef: '4.3',
        title: 'Solution of a Linear Equation',
        titleTelugu: 'రేఖీయ సమీకరణ పరిష్కారం',
        description:
          'Finding all the ordered pairs that satisfy a linear equation, by trying values of one variable.',
        descriptionTelugu:
          'ఒక విభిన్నం విలువలను ప్రయత్నించి రేఖీయ సమీకరణాన్ని తీర్చే క్రమ జతలన్నింటినీ కనుగొనడం.',
        concepts: [
          'Fix a value of x and compute the matching y.',
          'Each ordered pair found is a solution.',
          'Every solution lies on the graph of the equation.',
        ],
        conceptsTelugu: [
          'x విలువను నిర్ణేయి సరిపోలే y ను లెక్కించండి.',
          'కనుగొన్న ప్రతి క్రమ జత ఒక పరిష్కారం.',
          'ప్రతి పరిష్కారం సమీకరణం గ్రాఫ్పై ఉంటుంది.',
        ],
        learningObjectives: ['Find the solutions of a linear equation.'],
        learningObjectivesTelugu: ['రేఖీయ సమీకరణ పరిష్కారాలను కనుగొనడం.'],
      },
      {
        id: 'top-ap-s1-leq-graph',
        sectionRef: '4.4',
        title: 'Graph of a Linear Equation',
        titleTelugu: 'రేఖీయ సమీకరణం గ్రాఫ్',
        description:
          'Plotting the solutions of ax + by = c gives a straight line, which is the graph of the equation.',
        descriptionTelugu:
          'ax + by = c పరిష్కారాలను గ్రాఫ్‌లో గీస్తే సరళరేఖ లభిస్తుంది, అదే సమీకరణం గ్రాఫ్.',
        concepts: [
          'Find several solutions and plot them.',
          'Join the plotted points with a ruler.',
          'The resulting straight line is the graph.',
        ],
        conceptsTelugu: [
          'కొన్ని పరిష్కారాలను కనుగొని గీయండి.',
          'గీసిన బిందువులను రూలర్‌తో కలిపండి.',
          'అదే సరళరేఖ గ్రాఫ్ అవుతుంది.',
        ],
        learningObjectives: ['Graph a linear equation in two variables.'],
        learningObjectivesTelugu: ['రెండు విభిన్నాలలోని రేఖీయ సమీకరణాన్ని గ్రాఫ్ రూపంలో గీయడం.'],
        workedExample: {
          question: 'Draw the graph of 2x + y = 6.',
          questionTelugu: '2x + y = 6 గ్రాఫ్‌ను గీయండి.',
          steps: [
            { explanation: 'Put x = 0 to get y = 6, giving the point (0, 6).' },
            { explanation: 'Put y = 0 to get x = 3, giving the point (3, 0).' },
            { explanation: 'Plot (0, 6) and (3, 0) and join them with a ruler.' },
          ],
          finalAnswer: 'The graph is the straight line through (0, 6) and (3, 0).',
        },
      },
      {
        id: 'top-ap-s1-leq-summary',
        sectionRef: '4.4',
        title: 'Chapter 4 Summary',
        titleTelugu: 'అధ్యాయం 4 సారాంశం',
        description:
          'Key results of Chapter 4: linear equations in two variables, their solutions and their straight-line graphs.',
        descriptionTelugu:
          'అధ్యాయం 4 ప్రధాన ఫలితాలు: రెండు విభిన్నాలలోని రేఖీయ సమీకరణాలు, వాటి పరిష్కారాలు మరియు సరళరేఖ గ్రాఫ్‌లు.',
        concepts: [
          'Revise the form ax + by = c.',
          'Practise finding solutions and plotting graphs.',
        ],
        conceptsTelugu: [
          'ax + by = c రూపాన్ని పునఃపరిశీలించడం.',
          'పరిష్కారాలు కనుగొని గ్రాఫ్ గీయడం సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 4.'],
        learningObjectivesTelugu: ['అధ్యాయం 4 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 1 : CHAPTER 5 =====================
  {
    comment: 'AP SEM 1 : CHAPTER 5',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s1-euclids-geometry',
    chapterNumber: 5,
    title: "Introduction to Euclid's Geometry",
    titleTelugu: 'యూక్లిడ్ జ్యామితికి పరిచయం',
    description:
      "SCERT Andhra Pradesh Class IX, Semester 1, Chapter 5 (sections 5.1 - 5.3). Euclid's definitions, axioms and postulates, and the equivalent versions of his fifth postulate.",
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-1, అధ్యాయం 5 (5.1 - 5.3). యూక్లిడ్ నిర్వచనాలు, సిద్ధాంతాలు మరియు ఉపాధిగములు, ఐదవ ఉపాధిగమంలోని సమాన రూపాలు.',
    estimatedHours: 8,
    iconName: 'BookOpen',
    unitNumber: 1,
    unitLabel: 'Semester 1',
    unitLabelTelugu: 'సెమెస్టర్ 1',
    curriculumSource: "SCERT AP Class IX Maths Semester 1 - Chapter 5: Introduction to Euclid's Geometry (5.1 - 5.3)",
    learningOutcomes: [
      'Understand the role of definitions, axioms and postulates.',
      "State Euclid's axioms and postulates.",
      "Describe the equivalent versions of Euclid's fifth postulate.",
    ],
    learningOutcomesTelugu: [
      'నిర్వచనాలు, సిద్ధాంతాలు మరియు ఉపాధిగముల పాత్రను అర్థం చేసుకోవడం.',
      'యూక్లిడ్ సిద్ధాంతాలు మరియు ఉపాధిగములను చెప్పడం.',
      'యూక్లిడ్ ఐదవ ఉపాధిగమంలోని సమాన రూపాలను వివరించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s1-euc-intro',
        sectionRef: '5.1',
        title: 'Introduction',
        titleTelugu: 'పరిచయం',
        description:
          'Introduces Euclid, his Elements, and the Greek method of deductive reasoning using definitions, axioms and postulates.',
        descriptionTelugu:
          'యూక్లిడ్, వాటి అంశం మరియు నిర్వచనాలు, సిద్ధాంతాలు, ఉపాధిగముల ద్వారా తగ్గే విధానాన్ని పరిచయం చేస్తుంది.',
        concepts: [
          'Euclid wrote a famous text called Elements.',
          'Definitions describe the meaning of terms such as point, line and plane.',
          'Axioms and postulates are the rules used in deductive reasoning.',
        ],
        conceptsTelugu: [
          'యూక్లిడ్ ప్రసిద్ధమైన అంశం అనే పుస్తకాన్ని రాశారు.',
          'బిందువు, రేఖ మరియు తలం వంటి పదాల అర్థాన్ని నిర్వచనాలు వివరిస్తాయి.',
          'సిద్ధాంతాలు మరియు ఉపాధిగములు తగ్గే విధానంలో ఉపయోగించే నియమాలు.',
        ],
        learningObjectives: ['Describe Euclid and his method of reasoning.'],
        learningObjectivesTelugu: ['యూక్లిడ్ మరియు వాటి విధానాన్ని వివరించడం.'],
      },
      {
        id: 'top-ap-s1-euc-def',
        sectionRef: '5.2',
        title: "Euclid's Definitions, Axioms and Postulates",
        titleTelugu: 'యూక్లిడ్ నిర్వచనాలు, సిద్ధాంతాలు మరియు ఉపాధిగములు',
        description:
          "Euclid's definitions of point, line, surface and angle, together with his five postulates on extending geometric constructions.",
        descriptionTelugu:
          'బిందువు, రేఖ, తలం మరియు కోణం గురించిన యూక్లిడ్ నిర్వచనాలు, జ్యామిత నిర్మాణాలను విస్తరించడం గురించి ఆయన ఐదు ఉపాధిగములు.',
        concepts: [
          'A point has length and breadth but no thickness.',
          'A surface has length and breadth but no thickness.',
          'A line has length but neither breadth nor thickness.',
          'Euclid listed five postulates for geometric constructions.',
        ],
        conceptsTelugu: [
          'బిందువుకు పొడవు మరియు వెడల్పు ఉంటాయి కానీ మందసత్వం ఉండదు.',
          'తలానికి పొడవు మరియు వెడల్పు ఉంటాయి కానీ మందసత్వం ఉండదు.',
          'రేఖకు పొడవు ఉంటుంది కానీ వెడల్పు, మందసత్వం ఉండవు.',
          'జ్యామిత నిర్మాణాల కోసం యూక్లిడ్ ఐదు ఉపాధిగములను జాబితా చేశారు.',
        ],
        learningObjectives: ["State Euclid's definitions and five postulates."],
        learningObjectivesTelugu: ['యూక్లిడ్ నిర్వచనాలు మరియు ఐదు ఉపాధిగములను చెప్పడం.'],
        workedExample: {
          question: 'According to Euclid, which of these has length but no breadth or thickness?',
          questionTelugu: 'యూక్లిడ్ ప్రకారం ఏది పొడవు ఉంది కానీ వెడల్పు, మందసత్వం లేవు?',
          steps: [
            { explanation: 'A point has no length, breadth or thickness.' },
            { explanation: 'A surface has length and breadth but no thickness.' },
            { explanation: 'A line has length only, without breadth or thickness.' },
          ],
          finalAnswer: 'A line.',
        },
      },
      {
        id: 'top-ap-s1-euc-summary',
        sectionRef: '5.3',
        title: 'Chapter 5 Summary',
        titleTelugu: 'అధ్యాయం 5 సారాంశం',
        description:
          "Key results of Chapter 5: Euclid's definitions, axioms, postulates and the fifth postulate.",
        descriptionTelugu:
          'అధ్యాయం 5 ప్రధాన ఫలితాలు: యూక్లిడ్ నిర్వచనాలు, సిద్ధాంతాలు, ఉపాధిగములు మరియు ఐదవ ఉపాధిగమం.',
        concepts: [
          'Revise the meaning of definitions, axioms and postulates.',
          'Practise the five postulates of Euclid.',
        ],
        conceptsTelugu: [
          'నిర్వచనాలు, సిద్ధాంతాలు మరియు ఉపాధిగముల అర్థాన్ని పునఃపరిశీలించడం.',
          'యూక్లిడ్ ఐదు ఉపాధిగములను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 5.'],
        learningObjectivesTelugu: ['అధ్యాయం 5 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 1 : CHAPTER 6 =====================
  {
    comment: 'AP SEM 1 : CHAPTER 6',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s1-lines-angles',
    chapterNumber: 6,
    title: 'Lines and Angles',
    titleTelugu: 'రేఖలు మరియు కోణాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 1, Chapter 6 (sections 6.1 - 6.6). Basic terms and definitions, intersecting and non-intersecting lines, pairs of angles, and lines parallel to the same line.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-1, అధ్యాయం 6 (6.1 - 6.6). ప్రాథమిక పదాలు మరియు నిర్వచనాలు, ఖండించే మరియు ఖండించని రేఖలు, కోణ జతలు, ఒకే రేఖకు సమాంతరంగా ఉన్న రేఖలు.',
    estimatedHours: 16,
    iconName: 'Edit2',
    unitNumber: 1,
    unitLabel: 'Semester 1',
    unitLabelTelugu: 'సెమెస్టర్ 1',
    curriculumSource: 'SCERT AP Class IX Maths Semester 1 - Chapter 6: Lines and Angles (6.1 - 6.6)',
    learningOutcomes: [
      'Use basic terms and definitions of lines and angles.',
      'Identify intersecting and parallel lines.',
      'Work with pairs of angles.',
    ],
    learningOutcomesTelugu: [
      'రేఖలు మరియు కోణాల ప్రాథమిక పదాలను ఉపయోగించడం.',
      'ఖండించే రేఖలు మరియు సమాంతర రేఖలను గుర్తించడం.',
      'కోణ జతలతో పని చేయడం.',
    ],
    topics: [
      {
        id: 'top-ap-s1-la-intro',
        sectionRef: '6.1',
        title: 'Introduction',
        titleTelugu: 'పరిచయం',
        description:
          'Introduces rays, lines, angles and the ways of measuring angles, together with the symbol used for each.',
        descriptionTelugu:
          'కిరణాలు, రేఖలు, కోణాలు మరియు కోణాలను కొలిచే పద్ధతులను, ప్రతి వాటికి ఉపయోగించే చిహ్నంతో పరిచయం చేస్తుంది.',
        concepts: [
          'A ray has one end and extends infinitely in one direction.',
          'An angle is formed by two rays with a common end point.',
          'Angles are measured in degrees (deg).',
        ],
        conceptsTelugu: [
          'కిరణానికి ఒక చివరు ఉంటుంది మరియు అది ఒక దిశలో అనంతంగా విస్తరిస్తుంది.',
          'కోణం సామాన్య చివరు గల రెండు కిరణాలతో ఏర్పడుతుంది.',
          'కోణాలను డిగ్రీలో (deg) కొలుస్తారు.',
        ],
        learningObjectives: ['Define rays, lines and angles.'],
        learningObjectivesTelugu: ['కిరణాలు, రేఖలు మరియు కోణాలను నిర్వచించడం.'],
      },
      {
        id: 'top-ap-s1-la-terms',
        sectionRef: '6.2',
        title: 'Basic Terms and Definitions',
        titleTelugu: 'ప్రాథమిక పదాలు మరియు నిర్వచనాలు',
        description:
          'Defines a transversal, intersecting lines, parallel lines, coincident lines, and the different kinds of angles.',
        descriptionTelugu:
          'అతివ్యవహారం, ఖండించే రేఖలు, సమాంతర రేఖలు, ఒకే రేఖ మరియు విభిన్న రకాల కోణాలను నిర్వచిస్తుంది.',
        concepts: [
          'Intersecting lines meet at a point called the vertex.',
          'Parallel lines never meet, however far extended.',
          'Acute angle < 90 deg, right = 90 deg, obtuse > 90 deg and < 180 deg.',
          'A reflex angle is greater than 180 deg and less than 360 deg.',
        ],
        conceptsTelugu: [
          'ఖండించే రేఖలు శీర్షికంగా పేరువేయబడిన బిందువులో కలుస్తాయి.',
          'సమాంతర రేఖలు ఎంత విస్తరించినా కలవవు.',
          'లంబ కోణం 90 deg కంటే తక్కువ, లంబ కోణం 90 deg, అధిక కోణం 90 deg కంటే ఎక్కువ మరియు 180 deg కంటే తక్కువ.',
          'పరావర్తన కోణం 180 deg కంటే ఎక్కువ మరియు 360 deg కంటే తక్కువ.',
        ],
        learningObjectives: ['Use basic terms and definitions of lines and angles.'],
        learningObjectivesTelugu: ['రేఖలు మరియు కోణాల ప్రాథమిక పదాలను ఉపయోగించడం.'],
      },
      {
        id: 'top-ap-s1-la-intersect',
        sectionRef: '6.3',
        title: 'Intersecting Lines and Non-intersecting Lines',
        titleTelugu: 'ఖండించే రేఖలు మరియు ఖండించని రేఖలు',
        description:
          'Lines that meet at a point are intersecting; lines that never meet are non-intersecting, such as parallel lines in a plane.',
        descriptionTelugu:
          'ఒక బిందువులో కలిసే రేఖలు ఖండించే రేఖలు; ఎప్పుడూ కలవని రేఖలు ఖండించని రేఖలు, ఉదా. తలంలోని సమాంతర రేఖలు.',
        concepts: [
          'Intersecting lines meet at exactly one point.',
          'Non-intersecting lines never meet in a plane.',
          'Two distinct non-intersecting lines in a plane are parallel.',
        ],
        conceptsTelugu: [
          'ఖండించే రేఖలు ఖచ్చితంగా ఒక బిందువులో కలుస్తాయి.',
          'ఖండించని రేఖలు తలంలో ఎప్పుడూ కలవవు.',
          'తలంలోని వేర్వేరు ఖండించని రెండు రేఖలు సమాంతరాలు.',
        ],
        learningObjectives: ['Distinguish intersecting and non-intersecting lines.'],
        learningObjectivesTelugu: ['ఖండించే రేఖలు మరియు ఖండించని రేఖలను గుర్తించడం.'],
      },
      {
        id: 'top-ap-s1-la-pairs',
        sectionRef: '6.4',
        title: 'Pairs of Angles',
        titleTelugu: 'కోణ జతలు',
        description:
          'Defines adjacent, supplementary and complementary angles, and establishes the linear pair axiom.',
        descriptionTelugu:
          'సంబంధిత, పూరణ మరియు సంపూరక కోణాలను నిర్వచిస్తుంది మరియు రేఖీయ యుగ్మము సిద్ధాంతాన్ని నిర్ధారిస్తుంది.',
        concepts: [
          'Adjacent angles share a common arm and vertex.',
          'Complementary angles add up to 90 deg.',
          'Supplementary angles add up to 180 deg.',
          'A linear pair of angles is supplementary.',
        ],
        conceptsTelugu: [
          'సంబంధిత కోణాలు సామాన్య భుజం మరియు శీర్షికను పంచుకుంటాయి.',
          'సంపూరక కోణాల మొత్తం 90 deg.',
          'పూరణ కోణాల మొత్తం 180 deg.',
          'రేఖీయ యుగ్మము పూరణ కోణాలు.',
        ],
        learningObjectives: ['Identify pairs of angles.'],
        learningObjectivesTelugu: ['కోణ జతలను గుర్తించడం.'],
        workedExample: {
          question: 'Two adjacent angles on a straight line add up to 180 deg. If one is 65 deg, find the other.',
          questionTelugu: 'సరళరేఖపైని రెండు సంబంధిత కోణాల మొత్తం 180 deg. ఒకటి 65 deg అయితే మరొకటి ఎంత?',
          steps: [
            { explanation: 'Adjacent angles on a straight line form a linear pair.' },
            { explanation: 'So they are supplementary: the other angle is 180 - 65.', latex: '180^\\circ - 65^\\circ' },
            { explanation: 'Compute.', latex: '115^\\circ' },
          ],
          finalAnswer: 'The other angle is 115 deg.',
        },
      },
      {
        id: 'top-ap-s1-la-parallel',
        sectionRef: '6.5',
        title: 'Lines Parallel to the Same Line',
        titleTelugu: 'ఒకే రేఖకు సమాంతరంగా ఉన్న రేఖలు',
        description:
          'Lines parallel to the same line are parallel to each other, which gives the main results on parallel lines cut by a transversal.',
        descriptionTelugu:
          'ఒకే రేఖకు సమాంతరంగా ఉన్న రేఖలు ఒకదానితో మరొకది సమాంతరాలు, ఇది అతివ్యవహారంతో కట్టిన సమాంతర రేఖల ప్రధాన ఫలితాలకు దారి తీస్తుంది.',
        concepts: [
          'Lines parallel to the same line are parallel to each other.',
          'When a transversal cuts two parallel lines, corresponding angles are equal.',
          'Co-interior (allied) angles on the same side of a transversal sum to 180 deg.',
        ],
        conceptsTelugu: [
          'ఒకే రేఖకు సమాంతరంగా ఉన్న రేఖలు ఒకదానితో మరొకది సమాంతరాలు.',
          'అతివ్యవహారం రెండు సమాంతర రేఖలను కత్తితే సంబంధిత కోణాలు సమానం.',
          'అతివ్యవహారం ఒకే వైపు ఉన్న అంతర్గత కోణాల మొత్తం 180 deg.',
        ],
        learningObjectives: ['Apply results on lines parallel to the same line.'],
        learningObjectivesTelugu: ['ఒకే రేఖకు సమాంతరంగా ఉన్న రేఖల ఫలితాలను వర్తించడం.'],
      },
      {
        id: 'top-ap-s1-la-summary',
        sectionRef: '6.6',
        title: 'Chapter 6 Summary',
        titleTelugu: 'అధ్యాయం 6 సారాంశం',
        description:
          'Key results of Chapter 6: rays and angles, intersecting and parallel lines, pairs of angles and the linear pair theorem.',
        descriptionTelugu:
          'అధ్యాయం 6 ప్రధాన ఫలితాలు: కిరణాలు మరియు కోణాలు, ఖండించే మరియు సమాంతర రేఖలు, కోణ జతలు మరియు రేఖీయ యుగ్మము సిద్ధాంతం.',
        concepts: [
          'Revise the definitions of rays, lines and angles.',
          'Practise linear pair results and parallel line results.',
        ],
        conceptsTelugu: [
          'కిరణాలు, రేఖలు మరియు కోణాల నిర్వచనాలను పునఃపరిశీలించడం.',
          'రేఖీయ యుగ్మము ఫలితాలు మరియు సమాంతర రేఖల ఫలితాలను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 6.'],
        learningObjectivesTelugu: ['అధ్యాయం 6 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 2 : CHAPTER 7 =====================
  {
    comment: 'AP SEM 2 : CHAPTER 7',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s2-triangles',
    chapterNumber: 7,
    title: 'Triangles',
    titleTelugu: 'త్రిభుజాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 2, Chapter 7 (sections 7.1 - 7.6). Congruence of triangles, criteria for congruence, properties of a triangle, and more criteria for congruence.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-2, అధ్యాయం 7 (7.1 - 7.6). త్రిభుజాల సరాసమ్యత, సరాసమ్యత ధర్మాలు, త్రిభుజ ధర్మాలు మరియు మరిన్ని సరాసమ్యత ధర్మాలు.',
    estimatedHours: 16,
    iconName: 'Triangle',
    unitNumber: 2,
    unitLabel: 'Semester 2',
    unitLabelTelugu: 'సెమెస్టర్ 2',
    curriculumSource: 'SCERT AP Class IX Maths Semester 2 - Chapter 7: Triangles (7.1 - 7.6)',
    learningOutcomes: [
      'Understand congruence of triangles.',
      'Use the SAS, SSS, ASA, RHS and AAS criteria for congruence.',
      'Prove the basic properties of isosceles triangles.',
    ],
    learningOutcomesTelugu: [
      'త్రిభుజాల సరాసమ్యతను అర్థం చేసుకోవడం.',
      'SAS, SSS, ASA, RHS మరియు AAS సరాసమ్యత ధర్మాలను ఉపయోగించడం.',
      'సమద్విబాహు త్రిభుజాల ప్రధాన ధర్మాలను నిరూపించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s2-tri-intro',
        sectionRef: '7.1',
        title: 'Introduction',
        titleTelugu: 'పరిచయం',
        description:
          'Revises types of triangles by side and by angle, and introduces the matching parts of a triangle.',
        descriptionTelugu:
          'భుజాల ఆధారంగా మరియు కోణాల ఆధారంగా త్రిభుజాల రకాలను పునఃఅధ్యయనం చేసి సరిపోలు భాగాలను పరిచయం చేస్తుంది.',
        concepts: [
          'Triangles are classified by side or by angle.',
          'Corresponding parts are written in matching order.',
          'Congruent triangles have exactly the same shape and size.',
        ],
        conceptsTelugu: [
          'త్రిభుజాలను భుజాల లేదా కోణాల ఆధారంగా వర్గీకరించారు.',
          'సరిపోలు భాగాలను సరిపోలే క్రమంలో రాయాలి.',
          'సరాసమ్య త్రిభుజాలకు ఆకారం మరియు పరిమాణం ఒకేలా ఉంటాయి.',
        ],
        learningObjectives: ['Understand congruence of triangles.'],
        learningObjectivesTelugu: ['త్రిభుజాల సరాసమ్యతను అర్థం చేసుకోవడం.'],
      },
      {
        id: 'top-ap-s2-tri-congruence',
        sectionRef: '7.2',
        title: 'Congruence of Triangles',
        titleTelugu: 'త్రిభుజాల సరాసమ్యత',
        description:
          'Two triangles are congruent when their corresponding parts match exactly, which allows one to be placed on the other.',
        descriptionTelugu:
          'సరిపోలు భాగాలు ఖచ్చితంగా సరిపోలినప్పుడు రెండు త్రిభుజాలు సరాసమ్యమై, అప్పుడు ఒకటిని మరొకటిపై పెట్టవచ్చు.',
        concepts: [
          'Congruent triangles have equal corresponding sides and angles.',
          'The correspondence order must be maintained.',
          'Congruence is stronger than similarity.',
        ],
        conceptsTelugu: [
          'సరాసమ్య త్రిభుజాల్లో సరిపోలు భుజాలు మరియు కోణాలు సమానం.',
          'సరిపోలు క్రమాన్ని కదిలించకుండా పాటించాలి.',
          'సరాసమ్యత సమరూపత కంటే బలమైనది.',
        ],
        learningObjectives: ['Identify congruent triangles.'],
        learningObjectivesTelugu: ['సరాసమ్య త్రిభుజాలను గుర్తించడం.'],
      },
      {
        id: 'top-ap-s2-tri-criteria',
        sectionRef: '7.3',
        title: 'Criteria for Congruence of Triangles',
        titleTelugu: 'త్రిభుజాల సరాసమ్యత ధర్మాలు',
        description:
          'The SAS, SSS and ASA criteria, with examples of applying each to prove congruence.',
        descriptionTelugu:
          'SAS, SSS మరియు ASA ధర్మాలు, ప్రతిదానికి ఉదాహరణలతో సహితం.',
        concepts: [
          'SAS: side-angle-side is a congruence criterion.',
          'SSS: side-side-side is a congruence criterion.',
          'ASA: angle-side-angle is a congruence criterion.',
        ],
        conceptsTelugu: [
          'SAS: భుజం-కోణం-భుజం ఒక సరాసమ్యత ధర్మం.',
          'SSS: భుజం-భుజం-భుజం ఒక సరాసమ్యత ధర్మం.',
          'ASA: కోణం-భుజం-కోణం ఒక సరాసమ్యత ధర్మం.',
        ],
        learningObjectives: ['Apply SAS, SSS and ASA to prove congruence.'],
        learningObjectivesTelugu: ['సరాసమ్యతను నిరూపించడానికి SAS, SSS మరియు ASA ను వర్తించడం.'],
        workedExample: {
          question: 'In triangles ABC and DEF, AB = DE, BC = EF and angle B = angle E. Which criterion applies?',
          questionTelugu: 'ABC మరియు DEF త్రిభుజాల్లో AB = DE, BC = EF మరియు కోణం B = కోణం E. ఏ ధర్మం వర్తిస్తుంది?',
          steps: [
            { explanation: 'Two sides and the included angle are equal.' },
            { explanation: 'The included angle between AB and BC is angle B; between DE and EF it is angle E.' },
            { explanation: 'This matches the side-angle-side criterion.' },
          ],
          finalAnswer: 'By the SAS criterion, triangle ABC is congruent to triangle DEF.',
        },
      },
      {
        id: 'top-ap-s2-tri-properties',
        sectionRef: '7.4',
        title: 'Some Properties of a Triangle',
        titleTelugu: 'త్రిభుజంలోని కొన్ని ధర్మాలు',
        description:
          'Properties of isosceles and equilateral triangles, and the inequality of sides opposite larger angles.',
        descriptionTelugu:
          'సమద్విబాహు మరియు సమబాహు త్రిభుజాల ధర్మాలు, మరియు పెద్ద కోణాల ఎదురైన భుజాల అసమానత.',
        concepts: [
          'Angles opposite equal sides of a triangle are equal.',
          'Sides opposite equal angles are equal.',
          'The side opposite the larger angle is the longer side.',
        ],
        conceptsTelugu: [
          'సమాన భుజాల ఎదురైన కోణాలు సమానం.',
          'సమాన కోణాల ఎదురైన భుజాలు సమానం.',
          'పెద్ద కోణానికి ఎదురైన భుజం పొడవైనది.',
        ],
        learningObjectives: ['Prove the basic properties of isosceles triangles.'],
        learningObjectivesTelugu: ['సమద్విబాహు త్రిభుజాల ప్రధాన ధర్మాలను నిరూపించడం.'],
        formulas: [
          {
            title: 'Sides opposite larger angles are longer',
            titleTelugu: 'పెద్ద కోణాల ఎదురైన భుజాలు పొడవైనవి',
            latex: '\\angle A > \\angle B \\implies a > b',
            description: 'In a triangle, the side opposite the larger angle is longer.',
            descriptionTelugu: 'త్రిభుజంలో పెద్ద కోణానికి ఎదురైన భుజం పొడవైనది.',
            variables: [
              { symbol: 'a', meaning: 'side opposite angle A' },
              { symbol: 'b', meaning: 'side opposite angle B' },
            ],
          },
        ],
      },
      {
        id: 'top-ap-s2-tri-more',
        sectionRef: '7.5',
        title: 'Some More Criteria for Congruence of Triangles',
        titleTelugu: 'త్రిభుజాల సరాసమ్యతకు మరిన్ని ధర్మాలు',
        description:
          'The RHS and AAS criteria, and the fact that SSA is not in general a valid criterion for congruence.',
        descriptionTelugu:
          'RHS మరియు AAS ధర్మాలు, మరియు SSA సాధారణంగా సరాసమ్యతకు చెల్లిన ధర్మం కాదనే విషయం.',
        concepts: [
          'RHS: right angle-hypotenuse-side is a congruence criterion.',
          'AAS: angle-angle-side is a congruence criterion.',
          'SSA is not in general a valid congruence criterion.',
        ],
        conceptsTelugu: [
          'RHS: లంబ కోణం-కార్ణం-భుజం ఒక సరాసమ్యత ధర్మం.',
          'AAS: కోణం-కోణం-భుజం ఒక సరాసమ్యత ధర్మం.',
          'SSA సాధారణంగా సరాసమ్యతకు చెల్లిన ధర్మం కాదు.',
        ],
        learningObjectives: ['Apply the RHS and AAS criteria for congruence.'],
        learningObjectivesTelugu: ['సరాసమ్యత కోసం RHS మరియు AAS ధర్మాలను వర్తించడం.'],
      },
      {
        id: 'top-ap-s2-tri-summary',
        sectionRef: '7.6',
        title: 'Chapter 7 Summary',
        titleTelugu: 'అధ్యాయం 7 సారాంశం',
        description:
          'Key results of Chapter 7: congruence criteria and the basic properties of triangles.',
        descriptionTelugu:
          'అధ్యాయం 7 ప్రధాన ఫలితాలు: సరాసమ్యత ధర్మాలు మరియు త్రిభుజాల ప్రధాన ధర్మాలు.',
        concepts: [
          'Revise the SAS, SSS, ASA, RHS and AAS criteria.',
          'Practise the basic properties of triangles.',
        ],
        conceptsTelugu: [
          'SAS, SSS, ASA, RHS మరియు AAS ధర్మాలను పునఃపరిశీలించడం.',
          'త్రిభుజాల ప్రధాన ధర్మాలను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 7.'],
        learningObjectivesTelugu: ['అధ్యాయం 7 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 2 : CHAPTER 8 =====================
  {
    comment: 'AP SEM 2 : CHAPTER 8',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s2-quadrilaterals',
    chapterNumber: 8,
    title: 'Quadrilaterals',
    titleTelugu: 'చతుర్భుజాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 2, Chapter 8 (sections 8.1 - 8.3). Properties of a parallelogram and the mid-point theorem.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-2, అధ్యాయం 8 (8.1 - 8.3). సమాంతర చతుర్భుజం ధర్మాలు మరియు మధ్యబిందువు సిద్ధాంతం.',
    estimatedHours: 14,
    iconName: 'Square',
    unitNumber: 2,
    unitLabel: 'Semester 2',
    unitLabelTelugu: 'సెమెస్టర్ 2',
    curriculumSource: 'SCERT AP Class IX Maths Semester 2 - Chapter 8: Quadrilaterals (8.1 - 8.3)',
    learningOutcomes: [
      'State the properties of a parallelogram.',
      'Prove the mid-point theorem.',
      'Apply the mid-point theorem to triangles and parallelograms.',
    ],
    learningOutcomesTelugu: [
      'సమాంతర చతుర్భుజం ధర్మాలను చెప్పడం.',
      'మధ్యబిందువు సిద్ధాంతాన్ని నిరూపించడం.',
      'త్రిభుజాలు మరియు సమాంతర చతుర్భుజాలకు మధ్యబిందువు సిద్ధాంతాన్ని వర్తించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s2-quad-parallelogram',
        sectionRef: '8.1',
        title: 'Properties of a Parallelogram',
        titleTelugu: 'సమాంతర చతుర్భుజం ధర్మాలు',
        description:
          'The diagonals of a parallelogram bisect each other, opposite sides and angles are equal, and each diagonal divides it into two congruent triangles.',
        descriptionTelugu:
          'సమాంతర చతుర్భుజం యొక్క కర్ణాలు ఒకదానినొకటి సమద్విఖండన చేస్తాయి, ఎదురెదురు భుజాలు మరియు కోణాలు సమానం, ప్రతి కర్ణం దానిని రెండు సరాసమ్య త్రిభుజాలుగా విభజిస్తుంది.',
        concepts: [
          'Opposite sides of a parallelogram are equal and parallel.',
          'Opposite angles of a parallelogram are equal.',
          'The diagonals bisect each other at the point of intersection.',
          'Each diagonal divides the parallelogram into two congruent triangles.',
        ],
        conceptsTelugu: [
          'సమాంతర చతుర్భుజంలో ఎదురెదురు భుజాలు సమానం మరియు సమాంతరం.',
          'సమాంతర చతుర్భుజంలో ఎదురెదురు కోణాలు సమానం.',
          'కర్ణాలు ఖండన బిందువులో ఒకదానినొకటి సమద్విఖండన చేస్తాయి.',
          'ప్రతి కర్ణం సమాంతర చతుర్భుజాన్ని రెండు సరాసమ్య త్రిభుజాలుగా విభజిస్తుంది.',
        ],
        learningObjectives: ['State the properties of a parallelogram.'],
        learningObjectivesTelugu: ['సమాంతర చతుర్భుజం ధర్మాలను చెప్పడం.'],
        workedExample: {
          question: 'In parallelogram ABCD, if AB = 7 cm, what is CD?',
          questionTelugu: 'సమాంతర చతుర్భుజం ABCD లో AB = 7 సెం.మీ. అయితే CD ఎంత?',
          steps: [
            { explanation: 'Opposite sides of a parallelogram are equal.' },
            { explanation: 'CD is opposite to AB, so CD = AB.' },
          ],
          finalAnswer: 'CD = 7 cm.',
        },
      },
      {
        id: 'top-ap-s2-quad-midpoint',
        sectionRef: '8.2',
        title: 'The Mid-point Theorem',
        titleTelugu: 'మధ్యబిందువు సిద్ధాంతం',
        description:
          'The line joining the mid-points of two sides of a triangle is parallel to the third side and half its length.',
        descriptionTelugu:
          'త్రిభుజంలోని రెండు భుజాల మధ్యబిందువులను కలిపే రేఖ మూడవ భుజానికి సమాంతరం మరియు దాని అర్ధ పొడవు ఉంటుంది.',
        concepts: [
          'The segment joining the mid-points of two sides is parallel to the third side.',
          'That segment is half the length of the third side.',
          'Joining the mid-point to the vertex gives two congruent triangles.',
        ],
        conceptsTelugu: [
          'రెండు భుజాల మధ్యబిందువులను కలిపే ఖండం మూడవ భుజానికి సమాంతరం.',
          'ఆ ఖండం మూడవ భుజం అర్ధ పొడవు ఉంటుంది.',
          'మధ్యబిందువును శీర్షికతో కలిపితే రెండు సరాసమ్య త్రిభుజాలు ఏర్పడతాయి.',
        ],
        learningObjectives: ['Prove and apply the mid-point theorem.'],
        learningObjectivesTelugu: ['మధ్యబిందువు సిద్ధాంతాన్ని నిరూపించి వర్తించడం.'],
        formulas: [
          {
            title: 'Mid-point theorem for a triangle',
            titleTelugu: 'త్రిభుజంలోని మధ్యబిందువు సిద్ధాంతం',
            latex: '\\overline{MN} \\parallel \\overline{AB}, \\quad MN = \\frac{1}{2}\\,AB',
            description:
              'If M and N are the mid-points of two sides, MN is parallel to the third side and half its length.',
            descriptionTelugu:
              'M, N రెండు భుజాల మధ్యబిందువులైతే, MN మూడవ భుజానికి సమాంతరం మరియు దాని అర్ధం.',
            variables: [
              { symbol: 'M', meaning: 'mid-point of the first side' },
              { symbol: 'N', meaning: 'mid-point of the second side' },
              { symbol: 'AB', meaning: 'the third side' },
            ],
          },
        ],
      },
      {
        id: 'top-ap-s2-quad-summary',
        sectionRef: '8.3',
        title: 'Chapter 8 Summary',
        titleTelugu: 'అధ్యాయం 8 సారాంశం',
        description:
          'Key results of Chapter 8: properties of a parallelogram and the mid-point theorem.',
        descriptionTelugu:
          'అధ్యాయం 8 ప్రధాన ఫలితాలు: సమాంతర చతుర్భుజం ధర్మాలు మరియు మధ్యబిందువు సిద్ధాంతం.',
        concepts: [
          'Revise the properties of a parallelogram.',
          'Practise applications of the mid-point theorem.',
        ],
        conceptsTelugu: [
          'సమాంతర చతుర్భుజం ధర్మాలను పునఃపరిశీలించడం.',
          'మధ్యబిందువు సిద్ధాంతం అనువర్తనాలను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 8.'],
        learningObjectivesTelugu: ['అధ్యాయం 8 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 2 : CHAPTER 9 =====================
  {
    comment: 'AP SEM 2 : CHAPTER 9',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s2-circles',
    chapterNumber: 9,
    title: 'Circles',
    titleTelugu: 'వృత్తాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 2, Chapter 9 (sections 9.1 - 9.6). Angle subtended by a chord, perpendicular from the centre to a chord, equal chords, angle subtended by an arc, and cyclic quadrilaterals.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-2, అధ్యాయం 9 (9.1 - 9.6). జంట చేసే కోణం, కేంద్రం నుంచి జంటకు లంబం, సమాన జంటలు, చాత్రం చేసే కోణం మరియు చక్రీయ చతుర్భుజాలు.',
    estimatedHours: 14,
    iconName: 'Circle',
    unitNumber: 2,
    unitLabel: 'Semester 2',
    unitLabelTelugu: 'సెమెస్టర్ 2',
    curriculumSource: 'SCERT AP Class IX Maths Semester 2 - Chapter 9: Circles (9.1 - 9.6)',
    learningOutcomes: [
      'Apply the theorem on the angle subtended by a chord.',
      'Use equal-chord theorems.',
      'Identify cyclic quadrilaterals.',
    ],
    learningOutcomesTelugu: [
      'జంట చేసే కోణం సిద్ధాంతాన్ని వర్తించడం.',
      'సమాన జంటల సిద్ధాంతాలను ఉపయోగించడం.',
      'చక్రీయ చతుర్భుజాలను గుర్తించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s2-circ-chord',
        sectionRef: '9.1',
        title: 'Angle Subtended by a Chord at a Point',
        titleTelugu: 'ఒక బిందువులో జంట చేసే కోణం',
        description:
          'The angle subtended by a chord at the centre is twice the angle subtended at any point on the remaining part of the circle.',
        descriptionTelugu:
          'కేంద్రంలో జంట చేసే కోణం, వృత్తం మిగిలిన భాగంలోని ఏ బిందువులో జంట చేసే కోణానికి రెట్టింపు.',
        concepts: [
          'The angle at the centre is twice the angle at the circumference.',
          'Equal chords of a circle subtend equal angles at the centre.',
          'Chords subtending equal angles at the centre are equal.',
        ],
        conceptsTelugu: [
          'కేంద్రంలోని కోణం పరిధిలోని కోణం రెట్టింపు.',
          'వృత్తంలో సమాన జంటలు కేంద్రంలో సమాన కోణాలను ఏర్పరుస్తాయి.',
          'కేంద్రంలో సమాన కోణాలు ఏర్పరుస్తున్న జంటలు సమానం.',
        ],
        learningObjectives: ['Apply the angle subtended by a chord theorem.'],
        learningObjectivesTelugu: ['జంట చేసే కోణం సిద్ధాంతాన్ని వర్తించడం.'],
        formulas: [
          {
            title: 'Angle at the centre is twice the angle at the circumference',
            titleTelugu: 'కేంద్రంలోని కోణం పరిధిలోని కోణానికి రెట్టింపు',
            latex: '\\angle AOB = 2\\,\\angle AQB',
            description:
              'O is the centre and Q is a point on the remaining arc of the circle.',
            descriptionTelugu:
              'O కేంద్రం మరియు Q వృత్తం మిగిలిన చాత్రంపైని బిందువు.',
            variables: [
              { symbol: 'O', meaning: 'centre of the circle' },
              { symbol: 'Q', meaning: 'point on the remaining arc' },
            ],
          },
        ],
      },
      {
        id: 'top-ap-s2-circ-perp',
        sectionRef: '9.2',
        title: 'Perpendicular from the Centre to a Chord',
        titleTelugu: 'కేంద్రం నుంచి జంటకు లంబం',
        description:
          'A perpendicular from the centre of a circle to a chord bisects the chord, and conversely.',
        descriptionTelugu:
          'వృత్తం కేంద్రం నుంచి జంటకు వేయబడిన లంబం ఆ జంటను సమద్విఖండన చేస్తుంది, మరియు దీని విరామోద్ధం కూడా సత్యం.',
        concepts: [
          'A perpendicular from the centre to a chord bisects the chord.',
          'The line from the centre to the mid-point of a chord is perpendicular.',
          'The perpendicular from the centre bisects any chord it meets.',
        ],
        conceptsTelugu: [
          'కేంద్రం నుంచి జంటకు వేయబడిన లంబం ఆ జంటను సమద్విఖండన చేస్తుంది.',
          'జంట మధ్యబిందువుకు కేంద్రం నుంచి వెళ్లే రేఖ దానికి లంబం.',
          'కేంద్రం నుంచి వేయబడిన లంబం జంటను సమద్విఖండన చేస్తుంది.',
        ],
        learningObjectives: ['Use the perpendicular-from-centre theorem for chords.'],
        learningObjectivesTelugu: ['జంటలపై కేంద్రం నుంచి లంబ సిద్ధాంతాన్ని ఉపయోగించడం.'],
      },
      {
        id: 'top-ap-s2-circ-equal',
        sectionRef: '9.3',
        title: 'Equal Chords and Their Distances from the Centre',
        titleTelugu: 'సమాన జంటలు మరియు వాటి కేంద్రం నుంచి దూరాలు',
        description:
          'Equal chords are equidistant from the centre, and among unequal chords the longer chord is nearer the centre.',
        descriptionTelugu:
          'సమాన జంటలు కేంద్రం నుంచి సమాన దూరంలో ఉంటాయి, మరియు అసమాన జంటలలో పొడవైన జంట కేంద్రానికి దగ్గరగా ఉంటుంది.',
        concepts: [
          'Equal chords of a circle are equidistant from the centre.',
          'Chords equidistant from the centre are equal.',
          'The diameter is the longest chord of a circle.',
        ],
        conceptsTelugu: [
          'వృత్తంలో సమాన జంటలు కేంద్రం నుంచి సమాన దూరంలో ఉంటాయి.',
          'కేంద్రం నుంచి సమాన దూరంలో ఉన్న జంటలు సమానం.',
          'వృత్తం వ్యాసార్థం అతి పొడవైన జంట.',
        ],
        learningObjectives: ['Use equal-chord theorems.'],
        learningObjectivesTelugu: ['సమాన జంటల సిద్ధాంతాలను ఉపయోగించడం.'],
      },
      {
        id: 'top-ap-s2-circ-arc',
        sectionRef: '9.4',
        title: 'Angle Subtended by an Arc of a Circle',
        titleTelugu: 'వృత్త చాత్రం చేసే కోణం',
        description:
          'Angles in the same segment are equal, and the angle in a semicircle is a right angle.',
        descriptionTelugu:
          'ఒకే విభాగంలోని కోణాలు సమానం, మరియు అర్ధ వృత్తంలోని కోణం లంబ కోణం.',
        concepts: [
          'Angles subtended by the same chord in the same segment are equal.',
          'The angle in a semicircle is 90 deg.',
          'Chords subtending equal angles at the centre are equal in length.',
        ],
        conceptsTelugu: [
          'ఒకే విభాగంలో ఒకే జంట చేసే కోణాలు సమానం.',
          'అర్ధ వృత్తంలోని కోణం 90 deg.',
          'కేంద్రంలో సమాన కోణాలు ఏర్పరుస్తున్న జంటల పొడవులు సమానం.',
        ],
        learningObjectives: ['Apply results on angles subtended by an arc.'],
        learningObjectivesTelugu: ['చాత్రం చేసే కోణాల ఫలితాలను వర్తించడం.'],
        formulas: [
          {
            title: 'Angle in a semicircle is a right angle',
            titleTelugu: 'అర్ధ వృత్తంలోని కోణం లంబ కోణం',
            latex: '\\angle AQB = 90^\\circ',
            description: 'If AB is a diameter and Q is on the semicircle, the angle AQB is 90 deg.',
            descriptionTelugu:
              'AB వ్యాసార్థం మరియు Q అర్ధ వృత్తంపై ఉంటే, కోణం AQB 90 deg.',
            variables: [
              { symbol: 'AB', meaning: 'diameter of the circle' },
              { symbol: 'Q', meaning: 'point on the semicircle' },
            ],
          },
        ],
      },
      {
        id: 'top-ap-s2-circ-cyclic',
        sectionRef: '9.5',
        title: 'Cyclic Quadrilaterals',
        titleTelugu: 'చక్రీయ చతుర్భుజాలు',
        description:
          'A quadrilateral is cyclic if its opposite angles are supplementary, and conversely.',
        descriptionTelugu:
          'ఎదురెదురు కోణాలు పూరణంగా ఉంటే చతుర్భుజం చక్రీయం, మరియు దీని విరామోద్ధం కూడా సత్యం.',
        concepts: [
          'A cyclic quadrilateral has all four vertices on a circle.',
          'Opposite angles of a cyclic quadrilateral sum to 180 deg.',
          'A quadrilateral with supplementary opposite angles is cyclic.',
        ],
        conceptsTelugu: [
          'చక్రీయ చతుర్భుజంలో నాలుగు శీర్షికలు ఒకే వృత్తంపై ఉంటాయి.',
          'చక్రీయ చతుర్భుజంలో ఎదురెదురు కోణాల మొత్తం 180 deg.',
          'ఎదురెదురు కోణాలు పూరణంగా ఉన్న చతుర్భుజం చక్రీయం.',
        ],
        learningObjectives: ['Identify cyclic quadrilaterals.'],
        learningObjectivesTelugu: ['చక్రీయ చతుర్భుజాలను గుర్తించడం.'],
      },
      {
        id: 'top-ap-s2-circ-summary',
        sectionRef: '9.6',
        title: 'Chapter 9 Summary',
        titleTelugu: 'అధ్యాయం 9 సారాంశం',
        description:
          'Key results of Chapter 9: theorems on chords, arcs and cyclic quadrilaterals.',
        descriptionTelugu:
          'అధ్యాయం 9 ప్రధాన ఫలితాలు: జంటలు, చాత్రాలు మరియు చక్రీయ చతుర్భుజాల సిద్ధాంతాలు.',
        concepts: [
          'Revise the theorems on chords and arcs.',
          'Practise identifying cyclic quadrilaterals.',
        ],
        conceptsTelugu: [
          'జంటలు మరియు చాత్రాల సిద్ధాంతాలను పునఃపరిశీలించడం.',
          'చక్రీయ చతుర్భుజాలను గుర్తించడం సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 9.'],
        learningObjectivesTelugu: ['అధ్యాయం 9 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 2 : CHAPTER 10 ====================
  {
    comment: 'AP SEM 2 : CHAPTER 10',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s2-herons-formula',
    chapterNumber: 10,
    title: "Heron's Formula",
    titleTelugu: 'హీరన్ సూత్రం',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 2, Chapter 10 (sections 10.1 - 10.2). Area of a triangle by Heron formula.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-2, అధ్యాయం 10 (10.1 - 10.2). హీరన్ సూత్రంతో త్రిభుజ వైశాల్యం.',
    estimatedHours: 10,
    iconName: 'Layout',
    unitNumber: 2,
    unitLabel: 'Semester 2',
    unitLabelTelugu: 'సెమెస్టర్ 2',
    curriculumSource: "SCERT AP Class IX Maths Semester 2 - Chapter 10: Heron's Formula (10.1 - 10.2)",
    learningOutcomes: [
      'Compute the area of a triangle from its three sides.',
      'Apply Heron formula to practical problems.',
    ],
    learningOutcomesTelugu: [
      'మూడు భుజాల నుంచి త్రిభుజ వైశాల్యాన్ని లెక్కించడం.',
      'హీరన్ సూత్రాన్ని వాస్తవ సమస్యలకు వర్తించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s2-heron-area',
        sectionRef: '10.1',
        title: 'Area of a Triangle by Heron Formula',
        titleTelugu: 'హీరన్ సూత్రంతో త్రిభుజ వైశాల్యం',
        description:
          'If s is the semi-perimeter and a, b, c are the sides, the area of a triangle is √[s(s - a)(s - b)(s - c)].',
        descriptionTelugu:
          's అర్ధ చుట్టుకొలత మరియు a, b, c భుజాలైతే, త్రిభుజ వైశాల్యం √[s(s - a)(s - b)(s - c)].',
        concepts: [
          'The semi-perimeter is s = (a + b + c)/2.',
          'Heron formula is area = √[s(s - a)(s - b)(s - c)].',
          'The formula works only when the triangle inequality a + b > c holds.',
        ],
        conceptsTelugu: [
          'అర్ధ చుట్టుకొలత s = (a + b + c)/2.',
          'హీరన్ సూత్రం వైశాల్యం = √[s(s - a)(s - b)(s - c)].',
          'ఈ సూత్రం a + b > c అనే త్రిభుజ అసమానత నిలబడినప్పుడే వర్తిస్తుంది.',
        ],
        learningObjectives: ['Compute the area of a triangle using Heron formula.'],
        learningObjectivesTelugu: ['హీరన్ సూత్రంతో త్రిభుజ వైశాల్యాన్ని లెక్కించడం.'],
        formulas: [
          {
            title: 'Heron formula for the area of a triangle',
            titleTelugu: 'త్రిభుజ వైశాల్యానికి హీరన్ సూత్రం',
            latex: '\\text{Area} = \\sqrt{s(s-a)(s-b)(s-c)}, \\quad s = \\frac{a+b+c}{2}',
            description:
              'Gives the area of a triangle when all three sides are known, where s is the semi-perimeter.',
            descriptionTelugu:
              'మూడు భుజాలు తెలిసినప్పుడు త్రిభుజ వైశాల్యాన్ని ఇస్తుంది, ఇక్కడ s అర్ధ చుట్టుకొలత.',
            variables: [
              { symbol: 'a, b, c', meaning: 'the three sides of the triangle' },
              { symbol: 's', meaning: 'semi-perimeter, (a + b + c)/2' },
            ],
          },
        ],
        workedExample: {
          question: 'Find the area of a triangle with sides 6 cm, 8 cm and 10 cm.',
          questionTelugu: '6 సెం.మీ, 8 సెం.మీ మరియు 10 సెం.మీ భుజాలు గల త్రిభుజ వైశాల్యాన్ని కనుగొనండి.',
          steps: [
            { explanation: 'Find the semi-perimeter.', latex: 's = \\frac{6 + 8 + 10}{2} = 12' },
            { explanation: 'Substitute into Heron formula.', latex: '\\sqrt{12(12-6)(12-8)(12-10)}' },
            { explanation: 'Simplify inside the root.', latex: '\\sqrt{12 \\times 6 \\times 4 \\times 2} = \\sqrt{576}' },
            { explanation: 'Take the square root.', latex: '24' },
          ],
          finalAnswer: 'The area is 24 square cm.',
        },
      },
      {
        id: 'top-ap-s2-heron-summary',
        sectionRef: '10.2',
        title: 'Chapter 10 Summary',
        titleTelugu: 'అధ్యాయం 10 సారాంశం',
        description:
          "Key result of Chapter 10: Heron's formula for the area of a triangle from its three sides.",
        descriptionTelugu:
          'అధ్యాయం 10 ప్రధాన ఫలితం: మూడు భుజాల నుంచి త్రిభుజ వైశాల్యానికి హీరన్ సూత్రం.',
        concepts: [
          'Revise the statement of Heron formula.',
          'Practise substituting values into the formula.',
        ],
        conceptsTelugu: [
          'హీరన్ సూత్రం వాక్యాన్ని పునఃపరిశీలించడం.',
          'సూత్రంలో విలువలు ప్రత్యేకంగా వాడటం సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 10.'],
        learningObjectivesTelugu: ['అధ్యాయం 10 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 2 : CHAPTER 11 ====================
  {
    comment: 'AP SEM 2 : CHAPTER 11',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s2-surface-areas-volumes',
    chapterNumber: 11,
    title: 'Surface Areas and Volumes',
    titleTelugu: 'ప్రతిస్థాయి వైశాల్యాలు మరియు ఘనపరిమాణాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 2, Chapter 11 (sections 11.1 - 11.5). Surface area of a right circular cone, surface area of a sphere, volume of a right circular cone and volume of a sphere.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-2, అధ్యాయం 11 (11.1 - 11.5). నిలువు వృత్త శంకు ప్రతిస్థాయి వైశాల్యం, గోళ ప్రతిస్థాయి వైశాల్యం, నిలువు వృత్త శంకు ఘనపరిమాణం మరియు గోళ ఘనపరిమాణం.',
    estimatedHours: 16,
    iconName: 'Box',
    unitNumber: 2,
    unitLabel: 'Semester 2',
    unitLabelTelugu: 'సెమెస్టర్ 2',
    curriculumSource: 'SCERT AP Class IX Maths Semester 2 - Chapter 11: Surface Areas and Volumes (11.1 - 11.5)',
    learningOutcomes: [
      'Compute the surface area of a right circular cone.',
      'Compute the surface area of a sphere.',
      'Compute the volumes of a right circular cone and a sphere.',
    ],
    learningOutcomesTelugu: [
      'నిలువు వృత్త శంకు ప్రతిస్థాయి వైశాల్యాన్ని లెక్కించడం.',
      'గోళ ప్రతిస్థాయి వైశాల్యాన్ని లెక్కించడం.',
      'నిలువు వృత్త శంకు మరియు గోళ ఘనపరిమాణాలను లెక్కించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s2-sav-cone',
        sectionRef: '11.1',
        title: 'Surface Area of a Right Circular Cone',
        titleTelugu: 'నిలువు వృత్త శంకు ప్రతిస్థాయి వైశాల్యం',
        description:
          'The curved surface area of a cone is πrl and the total surface area is πr(r + l), where l is the slant height.',
        descriptionTelugu:
          'శంకు వక్ర ప్రతిస్థాయి వైశాల్యం πrl మరియు మొత్తం ప్రతిస్థాయి వైశాల్యం πr(r + l), ఇక్కడ l సర్వాంత ఎత్తు.',
        concepts: [
          'The slant height l satisfies l^2 = r^2 + h^2.',
          'Curved surface area = πrl.',
          'Total surface area = πr(r + l).',
        ],
        conceptsTelugu: [
          'సర్వాంత ఎత్తు l కు l^2 = r^2 + h^2.',
          'వక్ర ప్రతిస్థాయి వైశాల్యం = πrl.',
          'మొత్తం ప్రతిస్థాయి వైశాల్యం = πr(r + l).',
        ],
        learningObjectives: ['Compute the surface area of a right circular cone.'],
        learningObjectivesTelugu: ['నిలువు వృత్త శంకు ప్రతిస్థాయి వైశాల్యాన్ని లెక్కించడం.'],
        formulas: [
          {
            title: 'Curved surface area of a cone',
            titleTelugu: 'శంకు వక్ర ప్రతిస్థాయి వైశాల్యం',
            latex: '\\pi r l',
            description: 'Curved surface area of a right circular cone.',
            descriptionTelugu: 'నిలువు వృత్త శంకు వక్ర ప్రతిస్థాయి వైశాల్యం.',
            variables: [
              { symbol: 'r', meaning: 'radius of the base' },
              { symbol: 'l', meaning: 'slant height' },
            ],
          },
          {
            title: 'Total surface area of a cone',
            titleTelugu: 'శంకు మొత్తం ప్రతిస్థాయి వైశాల్యం',
            latex: '\\pi r (r + l)',
            description: 'Total surface area including the circular base.',
            descriptionTelugu: 'వృత్తాకార పృష్ఠాన్ని కలిపిన మొత్తం ప్రతిస్థాయి వైశాల్యం.',
            variables: [
              { symbol: 'r', meaning: 'radius of the base' },
              { symbol: 'l', meaning: 'slant height' },
            ],
          },
        ],
      },
      {
        id: 'top-ap-s2-sav-sphere-area',
        sectionRef: '11.2',
        title: 'Surface Area of a Sphere',
        titleTelugu: 'గోళ ప్రతిస్థాయి వైశాల్యం',
        description:
          'The surface area of a sphere of radius r is 4πr^2, and the curved surface area of a hemisphere is 2πr^2.',
        descriptionTelugu:
          'r వ్యాసార్థం గల గోళ ప్రతిస్థాయి వైశాల్యం 4πr^2, మరియు అర్ధ గోళ వక్ర ప్రతిస్థాయి వైశాల్యం 2πr^2.',
        concepts: [
          'Surface area of a sphere is 4πr^2.',
          'Curved surface area of a hemisphere is 2πr^2.',
          'Total surface area of a hemisphere is 3πr^2.',
        ],
        conceptsTelugu: [
          'గోళ ప్రతిస్థాయి వైశాల్యం 4πr^2.',
          'అర్ధ గోళ వక్ర ప్రతిస్థాయి వైశాల్యం 2πr^2.',
          'అర్ధ గోళ మొత్తం ప్రతిస్థాయి వైశాల్యం 3πr^2.',
        ],
        learningObjectives: ['Compute the surface area of a sphere.'],
        learningObjectivesTelugu: ['గోళ ప్రతిస్థాయి వైశాల్యాన్ని లెక్కించడం.'],
        formulas: [
          {
            title: 'Surface area of a sphere',
            titleTelugu: 'గోళ ప్రతిస్థాయి వైశాల్యం',
            latex: '4\\pi r^2',
            description: 'Surface area of a sphere of radius r.',
            descriptionTelugu: 'r వ్యాసార్థం గల గోళ ప్రతిస్థాయి వైశాల్యం.',
            variables: [{ symbol: 'r', meaning: 'radius of the sphere' }],
          },
        ],
      },
      {
        id: 'top-ap-s2-sav-cone-volume',
        sectionRef: '11.3',
        title: 'Volume of a Right Circular Cone',
        titleTelugu: 'నిలువు వృత్త శంకు ఘనపరిమాణం',
        description:
          'The volume of a cone is one third of the volume of the cylinder with the same radius and height.',
        descriptionTelugu:
          'శంకు ఘనపరిమాణం అదే వ్యాసార్థం, ఎత్తు ఉన్న సిలిండర్ ఘనపరిమాణంలో మూడింటి ఒకటి.',
        concepts: [
          'Volume of a cylinder is πr^2 h.',
          'Volume of a cone is (1/3)πr^2 h.',
          'The cone is one third of the corresponding cylinder.',
        ],
        conceptsTelugu: [
          'సిలిండర్ ఘనపరిమాణం πr^2 h.',
          'శంకు ఘనపరిమాణం (1/3)πr^2 h.',
          'శంకు సరిపోలే సిలిండర్ ఘనపరిమాణంలో మూడింటి ఒకటి.',
        ],
        learningObjectives: ['Compute the volume of a right circular cone.'],
        learningObjectivesTelugu: ['నిలువు వృత్త శంకు ఘనపరిమాణాన్ని లెక్కించడం.'],
        formulas: [
          {
            title: 'Volume of a cone',
            titleTelugu: 'శంకు ఘనపరిమాణం',
            latex: 'V = \\frac{1}{3}\\pi r^2 h',
            description: 'Volume of a right circular cone.',
            descriptionTelugu: 'నిలువు వృత్త శంకు ఘనపరిమాణం.',
            variables: [
              { symbol: 'r', meaning: 'radius of the base' },
              { symbol: 'h', meaning: 'perpendicular height' },
            ],
          },
        ],
      },
      {
        id: 'top-ap-s2-sav-sphere-volume',
        sectionRef: '11.4',
        title: 'Volume of a Sphere',
        titleTelugu: 'గోళ ఘనపరిమాణం',
        description:
          'The volume of a sphere of radius r is (4/3)πr^3, and the volume of a hemisphere is (2/3)πr^3.',
        descriptionTelugu:
          'r వ్యాసార్థం గల గోళ ఘనపరిమాణం (4/3)πr^3, మరియు అర్ధ గోళ ఘనపరిమాణం (2/3)πr^3.',
        concepts: [
          'Volume of a sphere is (4/3)πr^3.',
          'Volume of a hemisphere is (2/3)πr^3.',
          'The sphere is twice the volume of the hemisphere of the same radius.',
        ],
        conceptsTelugu: [
          'గోళ ఘనపరిమాణం (4/3)πr^3.',
          'అర్ధ గోళ ఘనపరిమాణం (2/3)πr^3.',
          'అదే వ్యాసార్థం గల అర్ధ గోళ ఘనపరిమాణం రెట్టింపు గోళ ఘనపరిమాణం.',
        ],
        learningObjectives: ['Compute the volume of a sphere.'],
        learningObjectivesTelugu: ['గోళ ఘనపరిమాణాన్ని లెక్కించడం.'],
        formulas: [
          {
            title: 'Volume of a sphere',
            titleTelugu: 'గోళ ఘనపరిమాణం',
            latex: 'V = \\frac{4}{3}\\pi r^3',
            description: 'Volume of a sphere of radius r.',
            descriptionTelugu: 'r వ్యాసార్థం గల గోళ ఘనపరిమాణం.',
            variables: [{ symbol: 'r', meaning: 'radius of the sphere' }],
          },
        ],
      },
      {
        id: 'top-ap-s2-sav-summary',
        sectionRef: '11.5',
        title: 'Chapter 11 Summary',
        titleTelugu: 'అధ్యాయం 11 సారాంశం',
        description:
          'Key results of Chapter 11: surface areas and volumes of cones, spheres and hemispheres.',
        descriptionTelugu:
          'అధ్యాయం 11 ప్రధాన ఫలితాలు: శంకులు, గోళాలు మరియు అర్ధ గోళాల ప్రతిస్థాయి వైశాల్యాలు మరియు ఘనపరిమాణాలు.',
        concepts: [
          'Revise the surface area formulas for cones and spheres.',
          'Practise the volume formulas for cones and spheres.',
        ],
        conceptsTelugu: [
          'శంకులు మరియు గోళాల ప్రతిస్థాయి వైశాల్య సూత్రాలను పునఃపరిశీలించడం.',
          'శంకులు మరియు గోళాల ఘనపరిమాణ సూత్రాలను సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 11.'],
        learningObjectivesTelugu: ['అధ్యాయం 11 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
  // ============================ SEMESTER 2 : CHAPTER 12 ====================
  {
    comment: 'AP SEM 2 : CHAPTER 12',
    board: 'AP_STATE_BOARD',
    id: 'ch-ap-s2-statistics',
    chapterNumber: 12,
    title: 'Statistics',
    titleTelugu: 'గణాంకాలు',
    description:
      'SCERT Andhra Pradesh Class IX, Semester 2, Chapter 12 (sections 12.1 - 12.2). Graphical representation of data.',
    descriptionTelugu:
      'ఆంధ్రప్రదేశ్ రాష్ట్ర పబ్లిక్ స్కూల్ ఎడుకతోని సెమెస్టర్-2, అధ్యాయం 12 (12.1 - 12.2). దత్తాంశం గ్రాఫ్ రూపంలో సూచన.',
    estimatedHours: 12,
    iconName: 'BarChart2',
    unitNumber: 2,
    unitLabel: 'Semester 2',
    unitLabelTelugu: 'సెమెస్టర్ 2',
    curriculumSource: 'SCERT AP Class IX Maths Semester 2 - Chapter 12: Statistics (12.1 - 12.2)',
    learningOutcomes: [
      'Collect and organise data.',
      'Represent data graphically using bar graphs and histograms.',
      'Interpret a graphical representation.',
    ],
    learningOutcomesTelugu: [
      'దత్తాంశాన్ని సేకరించి వర్గీకరించడం.',
      'బార్ రేఖలు మరియు హిస్టోగ్రామ్‌ల ద్వారా దత్తాంశాన్ని గ్రాఫ్ రూపంలో సూచించడం.',
      'గ్రాఫ్ రూపాన్ని వివరించడం.',
    ],
    topics: [
      {
        id: 'top-ap-s2-stat-graph',
        sectionRef: '12.1',
        title: 'Graphical Representation of Data',
        titleTelugu: 'దత్తాంశం గ్రాఫ్ రూపంలో సూచన',
        description:
          'Presenting collected data using bar graphs, histograms and pie charts so that patterns can be seen at a glance.',
        descriptionTelugu:
          'సేకరించిన దత్తాంశాన్ని బార్ రేఖలు, హిస్టోగ్రామ్‌లు మరియు పై చార్ట్‌ల ద్వారా సూచించి నమూనాలను త్వరగా చూడగలుగుతాం.',
        concepts: [
          'Bar graphs suit categorical data; histograms suit continuous data.',
          'Equal-width bars touch in a histogram but not in a bar graph.',
          'A pie chart shows parts of a whole as sector angles.',
        ],
        conceptsTelugu: [
          'బార్ రేఖలు వర్గీకరణ దత్తాంశానికి, హిస్టోగ్రామ్‌లు నిరంతర దత్తాంశానికి అనుకూలం.',
          'హిస్టోగ్రామ్‌లో సమాన వెడల్పు బార్లు కలుస్తాయి, బార్ రేఖలో కలవు.',
          'పై చార్ట్ అంతం భాగాలను రంధ్ర కోణాలుగా చూపిస్తుంది.',
        ],
        learningObjectives: ['Represent data graphically and interpret the graph.'],
        learningObjectivesTelugu: ['దత్తాంశాన్ని గ్రాఫ్ రూపంలో సూచించి వివరించడం.'],
        workedExample: {
          question: 'Which graph suits data that is collected in continuous intervals, such as heights?',
          questionTelugu: 'ఎత్తుల వంటి నిరంతర విభాగాల్లో సేకరించిన దత్తాంశానికి ఏ రేఖ సరిపోతుంది?',
          steps: [
            { explanation: 'Continuous data is grouped into intervals that touch each other.' },
            { explanation: 'Bars representing adjacent intervals therefore touch.' },
          ],
          finalAnswer: 'A histogram, because its bars touch.',
        },
      },
      {
        id: 'top-ap-s2-stat-summary',
        sectionRef: '12.2',
        title: 'Chapter 12 Summary',
        titleTelugu: 'అధ్యాయం 12 సారాంశం',
        description:
          'Key results of Chapter 12: graphical representation of data using bar graphs, histograms and pie charts.',
        descriptionTelugu:
          'అధ్యాయం 12 ప్రధాన ఫలితాలు: బార్ రేఖలు, హిస్టోగ్రామ్‌లు మరియు పై చార్ట్‌ల ద్వారా దత్తాంశం గ్రాఫ్ రూపంలో సూచన.',
        concepts: [
          'Revise the types of graphs and their uses.',
          'Practise choosing a suitable graph for given data.',
        ],
        conceptsTelugu: [
          'రేఖల రకాలు మరియు వాటి ఉపయోగాలను పునఃపరిశీలించడం.',
          'ఇచ్చిన దత్తాంశానికి సరైన రేఖను ఎంచుకోవడం సాధన చేయడం.',
        ],
        learningObjectives: ['Summarise the results of Chapter 12.'],
        learningObjectivesTelugu: ['అధ్యాయం 12 ఫలితాలను సారాంశం చేయడం.'],
      },
    ],
  },
];