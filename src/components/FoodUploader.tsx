/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Camera, Upload, AlertCircle, Check, Undo, Plus, Trash2, FileText } from 'lucide-react';
import { FoodItem, Ingredient } from '../types';
import { translations } from '../locales';

interface FoodUploaderProps {
  activeDate: string; // YYYY-MM-DD
  onSaveFoodItem: (item: Omit<FoodItem, 'id' | 'timestamp'>) => void;
  lang: 'ua' | 'en';
  theme: 'light' | 'dark';
}

const PROGRESS_STAGES_UK = [
  'Завантажуємо зображення страви...',
  'Розпізнаємо компоненти страви...',
  'Аналізуємо геометрію та об\'єм порції...',
  'Розраховуємо вагу та нутрієнти (білки, жири, вуглеводи)...',
  'Оформлюємо професійну оцінку нутриціолога...'
];

const PROGRESS_STAGES_EN = [
  'Uploading meal image...',
  'Identifying meal components...',
  'Analyzing geometry & portion volume...',
  'Calculating weight and macronutrients...',
  'Formulating professional nutritionist feedback...'
];

export default function FoodUploader({ activeDate, onSaveFoodItem, lang, theme }: FoodUploaderProps) {
  const [entryMode, setEntryMode] = useState<'photo' | 'text'>('photo');
  const [textQuery, setTextQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields for parsed food item
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [weightGrams, setWeightGrams] = useState(150);
  const [volumeMl, setVolumeMl] = useState(0);
  const [proteins, setProteins] = useState(0);
  const [fats, setFats] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [kcal, setKcal] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [explanation, setExplanation] = useState('');

  // Baseline values from AI analysis for dynamic scaling recalculation
  const [baseValues, setBaseValues] = useState<{
    weightGrams: number;
    volumeMl: number;
    proteins: number;
    fats: number;
    carbs: number;
    kcal: number;
    ingredients: Ingredient[];
  } | null>(null);

  const handleWeightChange = (newWeight: number) => {
    setWeightGrams(newWeight);
    if (baseValues && baseValues.weightGrams > 0) {
      const ratio = newWeight / baseValues.weightGrams;
      setProteins(parseFloat((baseValues.proteins * ratio).toFixed(1)));
      setFats(parseFloat((baseValues.fats * ratio).toFixed(1)));
      setCarbs(parseFloat((baseValues.carbs * ratio).toFixed(1)));
      setKcal(Math.round(baseValues.kcal * ratio));
      if (baseValues.ingredients && baseValues.ingredients.length > 0) {
        setIngredients(
          baseValues.ingredients.map(ing => ({
            ...ing,
            weight: parseFloat((ing.weight * ratio).toFixed(1))
          }))
        );
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolumeMl(newVolume);
    if (baseValues && baseValues.volumeMl > 0) {
      const ratio = newVolume / baseValues.volumeMl;
      setProteins(parseFloat((baseValues.proteins * ratio).toFixed(1)));
      setFats(parseFloat((baseValues.fats * ratio).toFixed(1)));
      setCarbs(parseFloat((baseValues.carbs * ratio).toFixed(1)));
      setKcal(Math.round(baseValues.kcal * ratio));
      if (baseValues.ingredients && baseValues.ingredients.length > 0) {
        setIngredients(
          baseValues.ingredients.map(ing => ({
            ...ing,
            weight: parseFloat((ing.weight * ratio).toFixed(1))
          }))
        );
      }
    }
  };

  const handleProteinChange = (newProteins: number) => {
    setProteins(newProteins);
    setKcal(Math.round(newProteins * 4 + fats * 9 + carbs * 4));
  };

  const handleFatChange = (newFats: number) => {
    setFats(newFats);
    setKcal(Math.round(proteins * 4 + newFats * 9 + carbs * 4));
  };

  const handleCarbChange = (newCarbs: number) => {
    setCarbs(newCarbs);
    setKcal(Math.round(proteins * 4 + fats * 9 + newCarbs * 4));
  };
  
  // Custom meal date state - can be overridden during food save
  const [mealDate, setMealDate] = useState(activeDate);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';
  const t = translations[lang];
  const progressStages = lang === 'ua' ? PROGRESS_STAGES_UK : PROGRESS_STAGES_EN;

  // Track active date updates
  useEffect(() => {
    setMealDate(activeDate);
  }, [activeDate]);

  // Simulated progressive stage steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev < progressStages.length - 1) return prev + 1;
          return prev;
        });
      }, 3000);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, progressStages]);

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Convert and downscale selected file
  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg(lang === 'ua' ? 'Будь ласка, завантажте фото страви у форматі JPG чи PNG.' : 'Please upload a food photo in JPG or PNG format.');
      return;
    }

    setMimeType('image/jpeg'); // Standardize on JPEG for optimal compression size
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as compressed JPEG to dramatically decrease base64 payload size
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(dataUrl);
          const base64Clean = dataUrl.split(',')[1];
          setImageBase64(base64Clean);
        } else {
          const resultStr = e.target?.result as string;
          setImagePreview(resultStr);
          const base64Clean = resultStr.split(',')[1];
          setImageBase64(base64Clean);
        }
      };

      img.onerror = () => {
        setErrorMsg(lang === 'ua' ? 'Помилка завантаження зображення.' : 'Error loading image.');
      };

      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg(lang === 'ua' ? 'Помилка при читанні файлу зображення.' : 'Error reading image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!imageBase64 || !mimeType) return;

    setIsLoading(true);
    setErrorMsg(null);
    setEditMode(false);

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          lang, // pass the language preference to Gemini nutritionist
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (lang === 'ua' ? 'Сталася помилка при аналізі ШІ.' : 'An error occurred during AI analysis.'));
      }

      setName(data.name || '');
      const parsedWeight = Number(data.weightGrams) || 0;
      const parsedVolume = Number(data.volumeMl) || 0;
      const parsedProteins = Number(data.proteins) || 0;
      const parsedFats = Number(data.fats) || 0;
      const parsedCarbs = Number(data.carbohydrates) || 0;
      const parsedKcal = Number(data.kcal) || 0;
      const parsedIngredients = Array.isArray(data.ingredients) ? data.ingredients : [];

      setWeightGrams(parsedWeight);
      setVolumeMl(parsedVolume);
      setProteins(parsedProteins);
      setFats(parsedFats);
      setCarbs(parsedCarbs);
      setKcal(parsedKcal);
      setIngredients(parsedIngredients);
      setExplanation(data.explanation || '');
      setBaseValues({
        weightGrams: parsedWeight,
        volumeMl: parsedVolume,
        proteins: parsedProteins,
        fats: parsedFats,
        carbs: parsedCarbs,
        kcal: parsedKcal,
        ingredients: parsedIngredients
      });
      setEditMode(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (lang === 'ua' ? 'Помилка з\'єднання. Перевірте статус налаштувань API-ключа GEMINI_API_KEY.' : 'Connection failure. Check your GEMINI_API_KEY environment status.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!textQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setEditMode(false);

    try {
      const response = await fetch('/api/analyze-food-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: textQuery,
          lang, // pass language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (lang === 'ua' ? 'Сталася помилка при аналізі ШІ.' : 'An error occurred during AI analysis.'));
      }

      setName(data.name || '');
      const parsedWeight = Number(data.weightGrams) || 0;
      const parsedVolume = Number(data.volumeMl) || 0;
      const parsedProteins = Number(data.proteins) || 0;
      const parsedFats = Number(data.fats) || 0;
      const parsedCarbs = Number(data.carbohydrates) || 0;
      const parsedKcal = Number(data.kcal) || 0;
      const parsedIngredients = Array.isArray(data.ingredients) ? data.ingredients : [];

      setWeightGrams(parsedWeight);
      setVolumeMl(parsedVolume);
      setProteins(parsedProteins);
      setFats(parsedFats);
      setCarbs(parsedCarbs);
      setKcal(parsedKcal);
      setIngredients(parsedIngredients);
      setExplanation(data.explanation || '');
      setBaseValues({
        weightGrams: parsedWeight,
        volumeMl: parsedVolume,
        proteins: parsedProteins,
        fats: parsedFats,
        carbs: parsedCarbs,
        kcal: parsedKcal,
        ingredients: parsedIngredients
      });
      setEditMode(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (lang === 'ua' ? 'Помилка з\'єднання. Перевірте статус налаштувань API-ключа GEMINI_API_KEY.' : 'Connection failure. Check your GEMINI_API_KEY environment status.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', weight: 0 }]);
  };

  const handleDeleteIngredient = (index: number) => {
    const next = [...ingredients];
    next.splice(index, 1);
    setIngredients(next);

    if (baseValues && baseValues.weightGrams > 0) {
      const newTotalWeight = next.reduce((acc, ing) => acc + (ing.weight || 0), 0);
      setWeightGrams(newTotalWeight);
      const ratio = newTotalWeight / baseValues.weightGrams;
      setProteins(parseFloat((baseValues.proteins * ratio).toFixed(1)));
      setFats(parseFloat((baseValues.fats * ratio).toFixed(1)));
      setCarbs(parseFloat((baseValues.carbs * ratio).toFixed(1)));
      setKcal(Math.round(baseValues.kcal * ratio));
    }
  };

  const handleUpdateIngredient = (index: number, key: keyof Ingredient, val: any) => {
    const next = [...ingredients];
    next[index] = {
      ...next[index],
      [key]: key === 'weight' ? (parseFloat(val) || 0) : val
    };
    setIngredients(next);

    if (key === 'weight' && baseValues && baseValues.weightGrams > 0) {
      const newTotalWeight = next.reduce((acc, ing) => acc + (ing.weight || 0), 0);
      if (newTotalWeight > 0) {
        setWeightGrams(newTotalWeight);
        const ratio = newTotalWeight / baseValues.weightGrams;
        setProteins(parseFloat((baseValues.proteins * ratio).toFixed(1)));
        setFats(parseFloat((baseValues.fats * ratio).toFixed(1)));
        setCarbs(parseFloat((baseValues.carbs * ratio).toFixed(1)));
        setKcal(Math.round(baseValues.kcal * ratio));
      }
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert(lang === 'ua' ? 'Будь ласка, вкажіть назву страви.' : 'Please enter a meal name.');
      return;
    }

    onSaveFoodItem({
      date: mealDate, // save specifically to user chosen/picked date
      name,
      imageUrl: imagePreview || undefined,
      weightGrams: Number(weightGrams) || 0,
      volumeMl: Number(volumeMl) || 0,
      proteins: Number(proteins) || 0,
      fats: Number(fats) || 0,
      carbohydrates: Number(carbs) || 0,
      kcal: Number(kcal) || 0,
      ingredients: ingredients.filter((ing) => ing.name.trim() !== ''),
      explanation,
    });

    handleReset();
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setMimeType(null);
    setEditMode(false);
    setErrorMsg(null);
    setTextQuery('');
    setMealDate(activeDate);
    setBaseValues(null);
  };

  const textProgressStages = lang === 'ua' 
    ? [
        'Розпізнаємо текстовий опис...',
        'Витягуємо інгредієнти та їх вагу...',
        'Розраховуємо нутрієнти (білки, жири, вуглеводи)...',
        'Формулюємо рекомендації ШІ нутриціолога...'
      ]
    : [
        'Analyzing text description...',
        'Extracting ingredients and portions...',
        'Calculating weight and macronutrients...',
        'Formulating professional nutritionist feedback...'
      ];

  const activeProgressStages = entryMode === 'text' ? textProgressStages : progressStages;

  return (
    <div 
      id="food-uploader-container" 
      className={`rounded-[32px] border p-6 transition-all duration-300 ${
        isDark ? 'bg-[#121B13]/95 border-[#223F24] text-zinc-100' : 'bg-white border-[#BDD6C2] text-[#1A1C1B]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-bold flex items-center gap-2">
          <Sparkles className={`w-5 h-5 ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27] fill-[#DCEEE0]/40'}`} />
          {entryMode === 'photo' ? t.newMealPhoto : t.textEntryTab}
        </h3>
        {(imagePreview || textQuery) && !isLoading && (
          <button
            onClick={handleReset}
            className={`text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark 
                ? 'bg-zinc-850 hover:bg-zinc-800 text-[#89FFA0]' 
                : 'bg-[#F3F7F4] hover:bg-[#DCEEE0] text-[#2D5A27]'
            }`}
          >
            <Undo className="w-3.5 h-3.5" />
            {t.reset}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-orange-50/5 border border-orange-500/20 text-orange-400 rounded-2xl text-xs flex gap-3 items-start animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-orange-450 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{t.analysisError}</p>
            <p className="mt-0.5 text-orange-400/95 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Mode switcher tabs (only when not loading or editing) */}
      {!editMode && !isLoading && (
        <div className={`flex p-1 mb-5 rounded-2xl ${isDark ? 'bg-[#0A110B]' : 'bg-[#EDF3EE]'}`}>
          <button
            type="button"
            onClick={() => setEntryMode('photo')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              entryMode === 'photo'
                ? isDark
                  ? 'bg-[#1D3A20] text-[#89FFA0] shadow-sm'
                  : 'bg-white text-[#2D5A27] shadow-xs'
                : isDark
                  ? 'text-[#527956] hover:text-[#89FFA0]'
                  : 'text-[#4D6C52] hover:text-[#2D5A27]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {t.photoEntryTab}
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('text')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              entryMode === 'text'
                ? isDark
                  ? 'bg-[#1D3A20] text-[#89FFA0] shadow-sm'
                  : 'bg-white text-[#2D5A27] shadow-xs'
                : isDark
                  ? 'text-[#527956] hover:text-[#89FFA0]'
                  : 'text-[#4D6C52] hover:text-[#2D5A27]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t.textEntryTab}
          </button>
        </div>
      )}

      {/* Photo Mode: Upload Box Zone */}
      {entryMode === 'photo' && !imagePreview && !isLoading && !editMode && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`border-2 border-dashed rounded-[32px] p-8 text-center flex flex-col items-center justify-center cursor-pointer min-h-[200px] transition-all duration-200 ${
            dragActive
              ? isDark ? 'border-[#89FFA0] bg-[#0A110B]' : 'border-[#2D5A27] bg-[#F1F8F4]'
              : isDark
                ? 'border-[#223F24] hover:border-[#89FFA0] hover:bg-[#0A110B]/40'
                : 'border-[#C1DEC7] hover:border-[#2D5A27] hover:bg-[#F1F8F4]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleChange}
            accept="image/*"
            className="hidden"
          />
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
            isDark ? 'bg-[#0A110B] text-[#89FFA0]' : 'bg-[#F1F8F4] text-[#2D5A27]'
          }`}>
            <Camera className="w-7 h-7" />
          </div>
          <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-[#4A5D4E]'}`}>
            {t.uploadPrompt}
          </h4>
          <p className="text-xs text-zinc-455 max-w-[285px] leading-relaxed text-zinc-500">
            {t.uploadDesc}
          </p>
          <button
            type="button"
            className={`mt-4 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              isDark ? 'bg-[#1D3A20] hover:bg-[#234427] text-white border border-[#2B542E]' : 'bg-[#2D5A27] text-white hover:bg-[#23471F]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {t.chooseFile}
          </button>
        </div>
      )}

      {/* Text Mode: Rich prompt editor */}
      {entryMode === 'text' && !editMode && !isLoading && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className={`text-xs font-bold uppercase block mb-1.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>
              {t.textPromptLabel}
            </label>
            <textarea
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder={t.textPromptPlaceholder}
              rows={4}
              className={`w-full p-4 text-xs rounded-[20px] border focus:ring-1 focus:outline-none transition-all leading-relaxed ${
                isDark 
                  ? 'bg-[#0B120C] border-[#223F24] focus:ring-[#89FFA0] text-white placeholder-zinc-500' 
                  : 'bg-white border-[#BDD6C2] focus:ring-[#2D5A27] text-[#1A1C1B] placeholder-gray-400'
              }`}
            />
          </div>
          <button
            onClick={handleAnalyzeText}
            disabled={!textQuery.trim()}
            className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-sm disabled:opacity-45 disabled:cursor-not-allowed ${
              isDark ? 'bg-[#89FFA0] text-[#0A110B] hover:bg-[#6be483]' : 'bg-[#2D5A27] text-white hover:bg-[#23471F]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t.analyzeTextBtn}
          </button>
        </div>
      )}

      {/* Analyzing simulation spinner */}
      {isLoading && (
        <div className={`flex flex-col items-center justify-center py-10 px-4 border rounded-2xl ${
          isDark ? 'border-[#223F24] bg-[#0A130B]/30' : 'border-[#BDD6C2] bg-[#F1F8F4]/40'
        }`}>
          <div className="relative flex items-center justify-center mb-5">
            <div className={`w-14 h-14 border-4 rounded-full animate-spin ${
              isDark ? 'border-[#1E3E21] border-t-[#89FFA0]' : 'border-[#DCEEE0] border-t-[#2D5A27]'
            }`}></div>
            <Sparkles className={`w-5 h-5 absolute animate-pulse ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`} />
          </div>
          <h4 className="text-sm font-bold mb-1.5 text-center">{entryMode === 'text' ? t.analyzingTextLoader : t.analyzingLoader}</h4>
          <p className={`text-xs italic max-w-sm text-center leading-relaxed h-10 flex items-center justify-center font-medium ${
            isDark ? 'text-zinc-500' : 'text-[#4A5D4E]'
          }`}>
            {activeProgressStages[loadingStage % activeProgressStages.length]}
          </p>
        </div>
      )}

      {/* Confirm analyze buttons */}
      {entryMode === 'photo' && imagePreview && !isLoading && !editMode && (
        <div className="space-y-4 animate-fadeIn">
          <div className={`relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center max-h-[250px] border ${
            isDark ? 'bg-[#0A130B] border-[#1E3A20]' : 'bg-[#F1F8F4] border-[#BDD6C2]'
          }`}>
            <img
              src={imagePreview}
              alt="Food entry preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleAnalyze}
            className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-sm ${
              isDark ? 'bg-[#89FFA0] text-[#0A110B] hover:bg-[#6be483]' : 'bg-[#2D5A27] text-white hover:bg-[#23471F]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t.runAnalysis}
          </button>
        </div>
      )}

      {/* Edit fields for returned details */}
      {editMode && (
        <div className={`mt-4 space-y-5 border-t pt-4 animate-fadeIn ${isDark ? 'border-zinc-800' : 'border-[#E2E8E4]'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {imagePreview ? (
              <div className={`relative rounded-xl overflow-hidden aspect-video sm:aspect-auto sm:h-full flex items-center justify-center max-h-[180px] border ${
                isDark ? 'bg-[#0A130B] border-[#1E3A20]' : 'bg-[#F1F8F4] border-[#BDD6C2]'
              }`}>
                <img
                  src={imagePreview}
                  alt="Analyzed preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            
            <div className={`space-y-2.5 ${imagePreview ? '' : 'sm:col-span-2'}`}>
              {/* Product title */}
              <div>
                <label className={`text-[10px] uppercase font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.mealNameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-sm border focus:ring-1 rounded-lg outline-none font-medium ${
                    isDark 
                      ? 'bg-[#0B120C] border-[#223F24] focus:border-[#89FFA0] focus:ring-[#89FFA0]/20 text-white' 
                      : 'bg-[#F1F8F4] border-[#BDD6C2] focus:border-[#2D5A27] focus:ring-[#DCEEE0] text-[#1D3220]'
                  }`}
                />
              </div>

              {/* Meal overridden date selector field */}
              <div>
                <label className={`text-[10px] uppercase font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.mealDate}</label>
                <div className={`relative w-full px-2.5 py-1.5 text-sm border focus-within:ring-1 rounded-lg outline-none font-medium flex items-center justify-between ${
                  isDark 
                    ? 'bg-[#0B120C] border-[#223F24] focus-within:border-[#89FFA0] focus-within:ring-[#89FFA0]/20 text-white' 
                    : 'bg-[#F1F8F4] border-[#BDD6C2] focus-within:border-[#2D5A27] focus-within:ring-[#DCEEE0] text-[#1D3220]'
                }`}>
                  <span className="select-none font-medium">
                    {(() => {
                      if (!mealDate) return '';
                      const parts = mealDate.split('-');
                      if (parts.length === 3) {
                        return `${parts[2]}.${parts[1]}.${parts[0]}`;
                      }
                      return mealDate;
                    })()}
                  </span>
                  <input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Weights metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] uppercase font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.weightG}</label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => handleWeightChange(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`w-full px-2.5 py-1.5 text-sm border focus:ring-1 rounded-lg outline-none ${
                      isDark 
                        ? 'bg-[#0B120C] border-[#1E3A20] text-white focus:border-[#89FFA0]' 
                        : 'bg-[#F1F8F4] border-[#BDD6C2] text-[#1D3220] focus:border-[#2D5A27]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] uppercase font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.volumeMl}</label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => handleVolumeChange(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`w-full px-2.5 py-1.5 text-sm border focus:ring-1 rounded-lg outline-none ${
                      isDark 
                        ? 'bg-[#0B120C] border-[#1E3A20] text-white focus:border-[#89FFA0]' 
                        : 'bg-[#F1F8F4] border-[#BDD6C2] text-[#1D3220] focus:border-[#2D5A27]'
                    }`}
                  />
                </div>
              </div>

              {/* Total calories */}
              <div>
                <label className={`text-[10px] uppercase font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.energyVal}</label>
                <input
                  type="number"
                  value={kcal}
                  onChange={(e) => setKcal(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-2.5 py-1.5 text-sm font-bold border focus:ring-1 rounded-lg outline-none ${
                    isDark
                      ? 'bg-[#89FFA0]/15 border-[#1E3A20] text-[#89FFA0] focus:border-[#89FFA0]'
                      : 'bg-[#F1F8F4] border-[#BDD6C2] text-[#2D5A27] focus:border-[#2D5A27]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Macros input row */}
          <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border ${
            isDark ? 'bg-[#070F08] border-[#1D381F]' : 'bg-[#EDF5EF] border-[#BDD6C2]'
          }`}>
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-0.5 text-center ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.proteins} ({lang === 'ua' ? 'г' : 'g'})</label>
              <input
                type="number"
                step="0.1"
                value={proteins}
                onChange={(e) => handleProteinChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full py-1 text-center text-xs border rounded-md outline-none font-mono ${
                  isDark 
                    ? 'bg-[#132515] border-[#1E3E21] text-[#89FFA0] focus:border-[#89FFA0]' 
                    : 'bg-white border-[#BDD6C2] text-[#2D5A27] focus:border-[#2D5A27]'
                }`}
              />
            </div>
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-0.5 text-center ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.fats} ({lang === 'ua' ? 'г' : 'g'})</label>
              <input
                type="number"
                step="0.1"
                value={fats}
                onChange={(e) => handleFatChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full py-1 text-center text-xs border rounded-md outline-none font-mono ${
                  isDark 
                    ? 'bg-[#132515] border-[#1E3E21] text-[#34D399] focus:border-[#89FFA0]' 
                    : 'bg-white border-[#BDD6C2] text-[#059669] focus:border-[#2D5A27]'
                }`}
              />
            </div>
            <div>
              <label className={`text-[9px] font-bold uppercase block mb-0.5 text-center ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.carbs} ({lang === 'ua' ? 'г' : 'g'})</label>
              <input
                type="number"
                step="0.1"
                value={carbs}
                onChange={(e) => handleCarbChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full py-1 text-center text-xs border rounded-md outline-none font-mono ${
                  isDark 
                    ? 'bg-[#132515] border-[#1E3E21] text-[#A2C3A8] focus:border-[#89FFA0]' 
                    : 'bg-white border-[#BDD6C2] text-[#527857] focus:border-[#2D5A27]'
                }`}
              />
            </div>
          </div>

          {/* Detailed item parts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.detailedIngredients}</label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className={`text-xs hover:underline font-bold flex items-center gap-1 cursor-pointer ${
                  isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addIng}
              </button>
            </div>
            
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    placeholder={lang === 'ua' ? 'Куряче філе, Яйце...' : 'Chicken fillet, Egg...'}
                    onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                    className={`flex-1 px-2.5 py-1 text-xs border rounded-lg outline-none font-medium ${
                      isDark 
                        ? 'bg-[#0B120C] border-[#1E3A20] text-white focus:border-[#89FFA0]' 
                        : 'bg-[#F1F8F4] border-[#BDD6C2] text-[#1D3220] focus:border-[#2D5A27]'
                    }`}
                  />
                  <input
                    type="number"
                    value={ing.weight}
                    placeholder={lang === 'ua' ? 'Вага' : 'Weight'}
                    onChange={(e) => handleUpdateIngredient(idx, 'weight', e.target.value)}
                    className={`w-18 px-2 py-1 text-xs border rounded-lg outline-none text-right font-mono ${
                      isDark 
                        ? 'bg-[#0B120C] border-[#1E3A20] text-white focus:border-[#89FFA0]' 
                        : 'bg-[#F1F8F4] border-[#BDD6C2] text-[#1D3220] focus:border-[#2D5A27]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteIngredient(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {ingredients.length === 0 && (
                <p className={`text-xs text-center py-2 rounded-lg border border-dashed font-medium ${
                  isDark ? 'border-[#1E3A20] text-[#55805B] bg-[#0A130B]/20' : 'border-[#BDD6C2] text-slate-500 bg-[#F1F8F4]'
                }`}>
                  {t.noIngredients}
                </p>
              )}
            </div>
          </div>

          {/* Explanation block */}
          {explanation && (
            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#0C160D] border-[#1E3A20] text-zinc-200' : 'bg-[#F1F8F4] border-[#BDD6C2] text-[#1D3220]'
            }`}>
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'
              }`}>{t.nutritionistConclusion}</span>
              <p className="text-xs leading-relaxed italic font-medium">{explanation}</p>
            </div>
          )}

          {/* Add to diary */}
          <button
            onClick={handleSave}
            className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-xs ${
              isDark ? 'bg-[#89FFA0] text-[#0A110B] hover:bg-[#6be483]' : 'bg-[#2D5A27] text-white hover:bg-[#23471F]'
            }`}
          >
            <Check className="w-4 h-4" />
            {t.addToDiary.replace('{0}', (() => {
              if (!mealDate) return '';
              const parts = mealDate.split('-');
              if (parts.length === 3) {
                return `${parts[2]}.${parts[1]}.${parts[0]}`;
              }
              return mealDate;
            })())}
          </button>
        </div>
      )}
    </div>
  );
}
