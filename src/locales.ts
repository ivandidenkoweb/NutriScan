/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationDictionary {
  appName: string;
  appSubtitle: string;
  loading: string;
  loginTitle: string;
  loginSubtitle: string;
  loginDesc: string;
  googleLogin: string;
  securityNotice: string;
  photoAnalysis: string;
  photoAnalysisDesc: string;
  dailyTdee: string;
  dailyTdeeDesc: string;
  cloudSync: string;
  cloudSyncDesc: string;
  targetGoal: string;
  loseWeight: string;
  gainWeight: string;
  maintainWeight: string;
  weight: string;
  heightAge: string;
  kcalBudget: string;
  proteins: string;
  fats: string;
  carbs: string;
  recalculateGoals: string;
  todayProgress: string;
  consumedLabel: string;
  consumedOf: string;
  signOut: string;
  cloudActive: string;
  syncing: string;
  cloudSyncedJustNow: string;
  cloudSyncedAt: string;
  clickToSync: string;
  welcome: string;
  welcomeSub: string;
  prevDay: string;
  nextDay: string;
  tdeeTitle: string;
  tdeeSubtitle: string;
  gender: string;
  female: string;
  male: string;
  ageYears: string;
  heightCm: string;
  weightCc: string;
  activityLevel: string;
  sedentary: string;
  light: string;
  moderate: string;
  active: string;
  very_active: string;
  primaryGoal: string;
  loseDesc: string;
  maintainDesc: string;
  gainDesc: string;
  calculate: string;
  cancel: string;
  targetOverview: string;
  saveTarget: string;
  calculatorNotice: string;
  newMealPhoto: string;
  textEntryTab: string;
  photoEntryTab: string;
  textPromptPlaceholder: string;
  textPromptLabel: string;
  analyzeTextBtn: string;
  analyzingTextLoader: string;
  reset: string;
  analysisError: string;
  uploadPrompt: string;
  uploadDesc: string;
  chooseFile: string;
  analyzingLoader: string;
  runAnalysis: string;
  mealNameLabel: string;
  weightG: string;
  volumeMl: string;
  energyVal: string;
  detailedIngredients: string;
  addIng: string;
  noIngredients: string;
  nutritionistConclusion: string;
  addToDiary: string;
  mealDate: string;
  todaySummary: string;
  ofKcal: string;
  completed: string;
  goalReached: string;
  remainingKcal: string;
  historyOf: string;
  emptyDiaryTitle: string;
  emptyDiaryDesc: string;
  delete: string;
  editMeal: string;
  saveBtn: string;
  mealComponents: string;
  nutritionistAlert: string;
  mealCountSuffix1: string;
  mealCountSuffixFew: string;
  mealCountSuffixMany: string;
  clickToRename: string;
  renameInputPlaceholder: string;
  waterTracker: string;
  waterTarget: string;
  waterAdd: string;
  bmiValueTitle: string;
  bmiTarget: string;
}

export const translations: Record<'ua' | 'en', TranslationDictionary> = {
  ua: {
    appName: 'NutriScan',
    appSubtitle: 'AI-Powered Photo Nutrition',
    loading: 'Завантаження NutriScan...',
    loginTitle: 'Синхронізація вашого харчування',
    loginSubtitle: 'на будь-якому пристрої',
    loginDesc: 'Один обліковий запис для збереження та відновлення щоденників харчування, розрахунків норми та автоматичного розпізнавання страв ШІ.',
    googleLogin: 'Увійти через Google',
    securityNotice: 'Хмарне сховище Google Cloud Run & Firebase Firestore. Всі дані повністю автентифіковані.',
    photoAnalysis: 'Аналіз страв по фото',
    photoAnalysisDesc: 'Підрахунок КБЖУ та аналіз інгредієнтів штучним інтелектом.',
    dailyTdee: 'Добова норма TDEE',
    dailyTdeeDesc: 'Автоматичний розрахунок дефіциту чи профіциту на основі ваших біометричних цілей.',
    cloudSync: 'Синхронізація у хмарі',
    cloudSyncDesc: 'Миттєве відновлення всіх даних на будь-якому новому смартфоні чи ноутбуці.',
    targetGoal: 'Ваша цільова норма',
    loseWeight: 'схуднення',
    gainWeight: 'набір',
    maintainWeight: 'утримання',
    weight: 'Вага',
    heightAge: 'Ріст / Вік',
    kcalBudget: 'Добова норма:',
    proteins: 'Білки',
    fats: 'Жири',
    carbs: 'Вуглеводи',
    recalculateGoals: 'Перерахувати цілі',
    todayProgress: 'Прогрес за сьогодні',
    consumedLabel: 'Засвоєно',
    consumedOf: 'Спожито {0} з {1} ккал',
    signOut: 'Вийти з облікового запису',
    cloudActive: 'Хмара активна',
    syncing: 'Синхронізація...',
    cloudSyncedJustNow: 'збережено у хмарі щойно',
    cloudSyncedAt: 'оновлено о {0}',
    clickToSync: 'Оновити дані',
    welcome: 'Вітаємо,',
    welcomeSub: 'Оцініть свій прийом їжі та дотримуйтесь здорового балансу',
    prevDay: 'Попередній день',
    nextDay: 'Наступний день',
    tdeeTitle: 'Калькулятор добової норми',
    tdeeSubtitle: 'Розрахуйте потреби в калоріях та макронутрієнтах під ваші цілі',
    gender: 'Стать',
    female: 'Жінка',
    male: 'Чоловік',
    ageYears: 'Вік (років)',
    heightCm: 'Ріст (см)',
    weightCc: 'Вага (кг)',
    activityLevel: 'Рівень фізичної активності',
    sedentary: 'Сидячий стиль життя (переважно без спорту)',
    light: 'Легка активність (піші прогулянки, легкі заняття 1-3 р/тиждень)',
    moderate: 'Помірна активність (тренування середньої важкості 3-5 р/тиждень)',
    active: 'Висока активність (інтенсивні заняття спортом майже щодня)',
    very_active: 'Екстремальна активність (професійні та важкі щоденні навантаження)',
    primaryGoal: 'Ваша головна ціль',
    loseDesc: 'Дефіцит енергії (-15%)',
    maintainDesc: 'Стабільний баланс',
    gainDesc: 'Безпечний профіцит (+10%)',
    calculate: 'Розрахувати показники',
    cancel: 'Скасувати',
    targetOverview: 'Ваші індивідуальні орієнтири:',
    saveTarget: 'Зберегти та встановити як ціль',
    calculatorNotice: 'Будь ласка, заповніть калькулятор параметрів вище, щоб розрахувати вашу індивідуальну добову норму КБЖУ для стабільної або цільової ваги!',
    newMealPhoto: 'Новий прийом їжі по фото',
    textEntryTab: 'Опис страви (текст)',
    photoEntryTab: 'Новий прийом по фото',
    textPromptPlaceholder: 'Наприклад: Запечена куряча грудка 200г, грецький салат 150г, склянка апельсинового соку 200мл',
    textPromptLabel: 'Впишіть продукти або страву сюди',
    analyzeTextBtn: 'Аналізувати текст страви з ШІ',
    analyzingTextLoader: 'ШІ нутриціолог розбирає опис...',
    reset: 'Скинути',
    analysisError: 'Помилка аналізу',
    uploadPrompt: 'Завантажте або перетягніть фото страви',
    uploadDesc: 'Штучний інтелект миттєво оцінить порцію, вагу в грамах, об\'єм та інгредієнти',
    chooseFile: 'Обрати файл',
    analyzingLoader: 'ШІ нутриціолог аналізує порцію...',
    runAnalysis: 'Запустити ШІ-аналіз порції',
    mealNameLabel: 'Назва страви (якщо потрібно, скоригуйте)',
    weightG: 'Вага (г)',
    volumeMl: 'Об\'єм (мл)',
    energyVal: 'Енергетична цінність (ккал)',
    detailedIngredients: 'Реальний склад інгредієнтів',
    addIng: 'Додати компонент',
    noIngredients: 'Немає окремого списку інгредієнтів',
    nutritionistConclusion: '💡 Висновок нутриціолога:',
    addToDiary: 'Додати до щоденника на {0}',
    mealDate: 'Дата прийому їжі',
    todaySummary: 'Сьогоднішній підсумок',
    ofKcal: 'з {0} ккал',
    completed: 'виконання',
    goalReached: 'Норму досягнуто! 🎉',
    remainingKcal: 'Залишилось: {0} ккал',
    historyOf: 'Історія за {0}',
    emptyDiaryTitle: 'Щоденник порожній',
    emptyDiaryDesc: 'Завантажте фото або вкажіть страву, щоб заповнити щоденник харчування.',
    delete: 'Видалити',
    editMeal: 'Редагувати',
    saveBtn: 'Зберегти',
    mealComponents: 'Компоненти страви:',
    nutritionistAlert: '💡 ШІ Нутриціолог:',
    mealCountSuffix1: 'прийом',
    mealCountSuffixFew: 'прийоми',
    mealCountSuffixMany: 'прийомів',
    clickToRename: 'Натисніть сюди щоб перейменувати',
    renameInputPlaceholder: 'Введіть ім\'я...',
    waterTracker: 'Швидкий трекер води',
    waterTarget: 'Цільовий об\'єм',
    waterAdd: '+{0} мл',
    bmiValueTitle: 'Індекс маси тіла (ІМТ/BMI)',
    bmiTarget: 'Статус ваги',
  },
  en: {
    appName: 'NutriScan',
    appSubtitle: 'AI-Powered Photo Nutrition',
    loading: 'Loading NutriScan...',
    loginTitle: 'Sync your daily nutrition',
    loginSubtitle: 'across any device',
    loginDesc: 'One account to securely save and retrieve food diaries, calculate nutrition targets, and analyze photos with AI.',
    googleLogin: 'Sign In with Google',
    securityNotice: 'Google Cloud Run & Firebase Firestore workspace. All data is highly secured and authenticated.',
    photoAnalysis: 'AI Photo Analysis',
    photoAnalysisDesc: 'Detailed calorie, size, and ingredient breakdown using advanced AI.',
    dailyTdee: 'Daily TDEE Target',
    dailyTdeeDesc: 'Automatic calorie surplus or deficit calculations based on your anthropometric goals.',
    cloudSync: 'Cloud Persistence',
    cloudSyncDesc: 'Instantly synced and available across physical smartphones or desktops.',
    targetGoal: 'Your Nutrition Budget',
    loseWeight: 'weight loss',
    gainWeight: 'weight gain',
    maintainWeight: 'maintenance',
    weight: 'Weight',
    heightAge: 'Height / Age',
    kcalBudget: 'Daily Allowance:',
    proteins: 'Proteins',
    fats: 'Fats',
    carbs: 'Carbs',
    recalculateGoals: 'Recalculate Goals',
    todayProgress: 'Today\'s Progress',
    consumedLabel: 'Consumed',
    consumedOf: 'Consumed {0} of {1} kcal',
    signOut: 'Sign Out Of Account',
    cloudActive: 'Cloud Active',
    syncing: 'Syncing...',
    cloudSyncedJustNow: 'saved to cloud just now',
    cloudSyncedAt: 'updated at {0}',
    clickToSync: 'Sync data',
    welcome: 'Welcome,',
    welcomeSub: 'Log your meals and maintain your healthy energy levels',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    tdeeTitle: 'Daily Allowance Calculator',
    tdeeSubtitle: 'Determine personalized calorie and macronutrient guidelines based on your targets',
    gender: 'Gender',
    female: 'Female',
    male: 'Male',
    ageYears: 'Age (years)',
    heightCm: 'Height (cm)',
    weightCc: 'Weight (kg)',
    activityLevel: 'Physical Activity Level',
    sedentary: 'Sedentary (primarily sitting, little to no exercise)',
    light: 'Light exercise (walking, light workouts 1-3 times/week)',
    moderate: 'Moderate activity (standard training 3-5 times/week)',
    active: 'Active lifestyle (intense training almost every day)',
    very_active: 'Extremely active (heavy workouts & physically demanding labor)',
    primaryGoal: 'Your Main Objective',
    loseDesc: 'Energy deficit (-15%)',
    maintainDesc: 'Balanced maintenance',
    gainDesc: 'Healthy surplus (+10%)',
    calculate: 'Calculate Guidelines',
    cancel: 'Cancel',
    targetOverview: 'Your Custom Benchmarks:',
    saveTarget: 'Save & Set as Active Goal',
    calculatorNotice: 'Please complete the biometric calculator above to set your custom daily targets!',
    newMealPhoto: 'New Meal Photo Scan',
    textEntryTab: 'Describe meal (text)',
    photoEntryTab: 'New Photo Scan',
    textPromptPlaceholder: 'e.g., Grilled chicken breast 200g, greek salad 150g, a glass of orange juice 200ml',
    textPromptLabel: 'Describe your meal or ingredients here',
    analyzeTextBtn: 'Analyze meal text with AI',
    analyzingTextLoader: 'AI nutritionist is analyzing text...',
    reset: 'Reset',
    analysisError: 'Analysis Error',
    uploadPrompt: 'Upload or drop your food picture here',
    uploadDesc: 'AI will instantly estimate portion size, total weight, volume, and composition',
    chooseFile: 'Select File',
    analyzingLoader: 'AI Nutritionist is analyzing portion...',
    runAnalysis: 'Start AI Nutrient Scan',
    mealNameLabel: 'Meal name (adjust if needed)',
    weightG: 'Weight (g)',
    volumeMl: 'Volume (ml)',
    energyVal: 'Energy value (kcal)',
    detailedIngredients: 'Detailed Composition',
    addIng: 'Add Ingredient',
    noIngredients: 'No individual ingredients listed',
    nutritionistConclusion: '💡 Nutritionist Feedback:',
    addToDiary: 'Add to diary on {0}',
    mealDate: 'Meal Date',
    todaySummary: 'Today\'s Nutrition',
    ofKcal: 'of {0} kcal',
    completed: 'completed',
    goalReached: 'Target reached! 🎉',
    remainingKcal: 'Remaining: {0} kcal',
    historyOf: 'History of {0}',
    emptyDiaryTitle: 'Diary is Empty',
    emptyDiaryDesc: 'Log your first meal by uploading a photo or entering it manually in the panel.',
    delete: 'Delete',
    editMeal: 'Edit',
    saveBtn: 'Save',
    mealComponents: 'Meal parts:',
    nutritionistAlert: '💡 AI Insights:',
    mealCountSuffix1: 'meal',
    mealCountSuffixFew: 'meals',
    mealCountSuffixMany: 'meals',
    clickToRename: 'Click to edit your name',
    renameInputPlaceholder: 'Enter name...',
    waterTracker: 'Quick Water Tracker',
    waterTarget: 'Daily Target',
    waterAdd: '+{0} ml',
    bmiValueTitle: 'Body Mass Index (BMI)',
    bmiTarget: 'Weight Status',
  }
};
