/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, FoodItem } from './types';
import TdeeCalculator from './components/TdeeCalculator';
import FoodUploader from './components/FoodUploader';
import DailyStats from './components/DailyStats';
import FoodDiaryList from './components/FoodDiaryList';
import HistoryAnalytics from './components/HistoryAnalytics';
import GlassmorphicAppleLogo from './components/GlassmorphicAppleLogo';
import { translations } from './locales';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Scale, 
  Info, 
  LogOut, 
  Cloud, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Camera,
  Moon,
  Sun,
  Droplet,
  Plus,
  Minus,
  RotateCcw,
  BarChart3,
  X,
  Menu
} from 'lucide-react';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  handleFirestoreError,
  OperationType 
} from './firebase';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  writeBatch,
  getDocFromServer 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_PROFILE: UserProfile = {
  isCalculated: false,
  weightCc: 75,
  heightCc: 176,
  ageCc: 28,
  genderCc: 'male',
  activityLevelCc: 'moderate',
  goalCc: 'maintain',
  targetKcal: 2300,
  targetProtein: 120,
  targetFat: 70,
  targetCarbs: 270,
};

export default function App() {
  // Authentication & Hydration States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Localization and theme preferences
  const [lang, setLang] = useState<'ua' | 'en'>(() => {
    return (localStorage.getItem('nutri_lang') as 'ua' | 'en') || 'ua';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nutri_theme') as 'light' | 'dark') || 'light';
  });

  // Core App States
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(lang === 'ua' ? 'Користувач' : 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [diaryItems, setDiaryItems] = useState<FoodItem[]>([]);
  const [waterLogs, setWaterLogs] = useState<Record<string, { amount: number; target: number }>>(() => {
    const local = localStorage.getItem('nutri_water_logs');
    return local ? JSON.parse(local) : {};
  });

  useEffect(() => {
    localStorage.setItem('nutri_water_logs', JSON.stringify(waterLogs));
  }, [waterLogs]);

  const calculatorRef = useRef<HTMLDivElement>(null);

  const handleToggleCalculator = () => {
    setShowCalculator(prev => {
      const next = !prev;
      if (next) setShowAnalytics(false);
      return next;
    });
  };

  const handleShowCalculator = () => {
    setShowCalculator(true);
    setShowAnalytics(false);
  };

  // Apply theme constraints
  useEffect(() => {
    localStorage.setItem('nutri_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply language constraints
  useEffect(() => {
    localStorage.setItem('nutri_lang', lang);
  }, [lang]);

  // Dynamic translators
  const t = translations[lang];
  const isDark = theme === 'dark';

  // 1. Mandatory Firestore Connection Validation on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firebase network connection check completed successfully.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration: Client appears to be offline.");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Manage Authentication State & Subscriptions
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeMeals: (() => void) | null = null;
    let unsubscribeWater: (() => void) | null = null;

    const cleanupSubscriptions = () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (unsubscribeMeals) {
        unsubscribeMeals();
        unsubscribeMeals = null;
      }
      if (unsubscribeWater) {
        unsubscribeWater();
        unsubscribeWater = null;
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clear previous active subscriptions first
      cleanupSubscriptions();

      if (currentUser) {
        const uid = currentUser.uid;
        
        // Lazy Onboarding / Data Migration from legacy localStorage
        try {
          setIsSyncing(true);
          
          // Check if user already has profile and meals in the cloud
          const userMealsSnapshot = await getDocs(collection(db, 'users', uid, 'meals'));
          const userMealsCount = userMealsSnapshot.size;
          
          let cloudProfileExists = false;
          try {
            const docSnap = await getDocFromServer(doc(db, 'users', uid));
            cloudProfileExists = docSnap.exists();
          } catch (e) {
            console.error("Error verifying cloud profile existence: ", e);
          }

          const localProfileStr = localStorage.getItem('food_tracker_profile');
          const localMealsStr = localStorage.getItem('food_tracker_diary');
          const localUsername = localStorage.getItem('food_tracker_username');

          // Migrate Profile if non-existent in cloud
          if (!cloudProfileExists && localProfileStr) {
            const localProfile = JSON.parse(localProfileStr) as UserProfile;
            if (localProfile.isCalculated) {
              await setDoc(doc(db, 'users', uid), {
                ...localProfile,
                username: localUsername || currentUser.displayName || (lang === 'ua' ? 'Користувач' : 'User'),
              });
            }
          }

          // Migrate Meals if non-existent in cloud
          if (userMealsCount === 0 && localMealsStr) {
            const localMeals = JSON.parse(localMealsStr) as FoodItem[];
            if (localMeals.length > 0) {
              const batch = writeBatch(db);
              localMeals.forEach((meal) => {
                const validatedMeal = {
                  id: meal.id,
                  date: meal.date,
                  timestamp: Number(meal.timestamp),
                  name: String(meal.name || '').substring(0, 400),
                  weightGrams: Number(meal.weightGrams) || 0,
                  volumeMl: Number(meal.volumeMl) || 0,
                  proteins: Number(meal.proteins) || 0,
                  fats: Number(meal.fats) || 0,
                  carbohydrates: Number(meal.carbohydrates) || 0,
                  kcal: Math.round(Number(meal.kcal)) || 0,
                  explanation: String(meal.explanation || '').substring(0, 8192),
                  ingredients: (meal.ingredients || []).map(ing => ({
                    name: String(ing.name || ''),
                    weight: Number(ing.weight) || 0
                  })).slice(0, 100),
                } as any;
                if (meal.imageUrl) {
                  validatedMeal.imageUrl = meal.imageUrl;
                }
                const mealDocRef = doc(db, 'users', uid, 'meals', meal.id);
                batch.set(mealDocRef, validatedMeal);
              });
              await batch.commit();
            }
          }

          // Legacy data migrated, clear storage safely
          localStorage.removeItem('food_tracker_profile');
          localStorage.removeItem('food_tracker_diary');
          localStorage.removeItem('food_tracker_username');

        } catch (migrationError) {
          console.error("Migration error: ", migrationError);
        } finally {
          setIsSyncing(false);
        }

        // Setup real-time listeners for User Profile & Username
        unsubscribeProfile = onSnapshot(doc(db, 'users', uid), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setProfile({
              isCalculated: Boolean(data.isCalculated),
              weightCc: Number(data.weightCc) || 75,
              heightCc: Number(data.heightCc) || 176,
              ageCc: Number(data.ageCc) || 28,
              genderCc: data.genderCc === 'female' ? 'female' : 'male',
              activityLevelCc: data.activityLevelCc || 'moderate',
              goalCc: data.goalCc || 'maintain',
              targetKcal: Number(data.targetKcal) || 2300,
              targetProtein: Number(data.targetProtein) || 120,
              targetFat: Number(data.targetFat) || 70,
              targetCarbs: Number(data.targetCarbs) || 270,
            });
            if (data.username) {
              setUserName(data.username);
            } else {
              setUserName(currentUser.displayName || (lang === 'ua' ? 'Користувач' : 'User'));
            }
            setLastSyncTime(new Date());
          } else {
            // Fallback for newly registered account
            setProfile(DEFAULT_PROFILE);
            setUserName(currentUser.displayName || (lang === 'ua' ? 'Користувач' : 'User'));
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        });

        // Setup real-time listener for user meals subcollection
        unsubscribeMeals = onSnapshot(collection(db, 'users', uid, 'meals'), (snapshot) => {
          const items: FoodItem[] = [];
          snapshot.forEach((mealDoc) => {
            const data = mealDoc.data();
            items.push({
              id: mealDoc.id,
              date: data.date,
              timestamp: Number(data.timestamp),
              name: String(data.name || ''),
              imageUrl: data.imageUrl,
              weightGrams: Number(data.weightGrams) || 0,
              volumeMl: Number(data.volumeMl) || 0,
              proteins: Number(data.proteins) || 0,
              fats: Number(data.fats) || 0,
              carbohydrates: Number(data.carbohydrates) || 0,
              kcal: Math.round(Number(data.kcal)) || 0,
              ingredients: (data.ingredients || []).map((ing: any) => ({
                name: String(ing.name || ''),
                weight: Number(ing.weight) || 0
              })),
              explanation: String(data.explanation || ''),
            });
          });
          // Sort descending by registration timestamp
          items.sort((a, b) => b.timestamp - a.timestamp);
          setDiaryItems(items);
          setLastSyncTime(new Date());
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${uid}/meals`);
        });

        // Setup real-time listener for user water subcollection
        unsubscribeWater = onSnapshot(collection(db, 'users', uid, 'water'), (snapshot) => {
          const syncedWater: Record<string, { amount: number; target: number }> = {};
          snapshot.forEach((waterDoc) => {
            const data = waterDoc.data();
            syncedWater[waterDoc.id] = {
              amount: Number(data.amount) || 0,
              target: Number(data.target) || 2000,
            };
          });
          setWaterLogs((prev) => ({
            ...prev,
            ...syncedWater
          }));
        }, (err) => {
          console.error("Error listening to water subcollection:", err);
        });

        setAuthLoading(false);

      } else {
        // Safe reset if user is signed out
        setProfile(DEFAULT_PROFILE);
        setUserName(lang === 'ua' ? 'Користувач' : 'User');
        setDiaryItems([]);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupSubscriptions();
    };
  }, [lang]);

  const handleManualSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
    }, 850);
  };

  const handleUpdateWater = async (date: string, deltaAmount: number) => {
    const recommendedWater = Math.round((profile.weightCc || 75) * 35);
    const currentLog = waterLogs[date] || { amount: 0, target: recommendedWater };
    let nextAmount = currentLog.amount + deltaAmount;
    if (deltaAmount === 0) {
      nextAmount = 0; // reset
    }
    nextAmount = Math.max(0, nextAmount);

    const nextLog = {
      amount: nextAmount,
      target: currentLog.target || recommendedWater
    };

    setWaterLogs((prev) => ({
      ...prev,
      [date]: nextLog
    }));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'water', date), {
          amount: nextLog.amount,
          target: nextLog.target,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.error("Error updating water log in Firestore:", e);
      }
    }
  };

  // Google Sign-In Action
  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Sign-in failed", e);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign-Out Action
  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await signOut(auth);
    } catch (e) {
      console.error("Sign-out failed", e);
    } finally {
      setAuthLoading(false);
    }
  };

  // Convert/shift selected date limits relative to offset
  const handleOffsetDate = (offset: number) => {
    try {
      const d = new Date(selectedDate);
      if (isNaN(d.getTime())) return;
      d.setDate(d.getDate() + offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Core Sync actions back-propagating state to cloud
  const handleSaveProfile = async (nextProfile: UserProfile) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const targetPath = `users/${uid}`;
    try {
      setIsSyncing(true);
      const validatedProfile = {
        isCalculated: true,
        weightCc: Number(nextProfile.weightCc),
        heightCc: Number(nextProfile.heightCc),
        ageCc: Math.round(Number(nextProfile.ageCc)),
        genderCc: nextProfile.genderCc,
        activityLevelCc: nextProfile.activityLevelCc,
        goalCc: nextProfile.goalCc,
        targetKcal: Math.round(Number(nextProfile.targetKcal)),
        targetProtein: Math.round(Number(nextProfile.targetProtein)),
        targetFat: Math.round(Number(nextProfile.targetFat)),
        targetCarbs: Math.round(Number(nextProfile.targetCarbs)),
        username: userName,
      };
      await setDoc(doc(db, 'users', uid), validatedProfile);
      setShowCalculator(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, targetPath);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveName = async (nameVal: string) => {
    const clean = nameVal.trim() || (lang === 'ua' ? 'Користувач' : 'User');
    setUserName(clean);
    setIsEditingName(false);

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const targetPath = `users/${uid}`;
    try {
      setIsSyncing(true);
      const updatedProfile = {
        ...profile,
        username: clean,
      };
      await setDoc(doc(db, 'users', uid), updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, targetPath);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveFoodItem = async (newItem: Omit<FoodItem, 'id' | 'timestamp'>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const itemId = `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const itemWithId: FoodItem = {
      id: itemId,
      date: newItem.date,
      timestamp,
      name: String(newItem.name || ''),
      weightGrams: Number(newItem.weightGrams) || 0,
      volumeMl: Number(newItem.volumeMl) || 0,
      proteins: Number(newItem.proteins) || 0,
      fats: Number(newItem.fats) || 0,
      carbohydrates: Number(newItem.carbohydrates) || 0,
      kcal: Math.round(Number(newItem.kcal)) || 0,
      explanation: String(newItem.explanation || '').substring(0, 8192),
      ingredients: (newItem.ingredients || []).map(ing => ({
        name: String(ing.name || ''),
        weight: Number(ing.weight) || 0
      })).slice(0, 100),
    };

    if (newItem.imageUrl !== undefined) {
      itemWithId.imageUrl = newItem.imageUrl;
    }

    const targetPath = `users/${uid}/meals/${itemId}`;
    try {
      setIsSyncing(true);
      await setDoc(doc(db, 'users', uid, 'meals', itemId), itemWithId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, targetPath);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteFoodItem = async (id: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const targetPath = `users/${uid}/meals/${id}`;
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'users', uid, 'meals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, targetPath);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateFoodItem = async (id: string, updatedItem: FoodItem) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const targetPath = `users/${uid}/meals/${id}`;
    const validatedItem: FoodItem = {
      id: updatedItem.id,
      date: updatedItem.date,
      timestamp: updatedItem.timestamp,
      name: String(updatedItem.name || ''),
      weightGrams: Number(updatedItem.weightGrams) || 0,
      volumeMl: Number(updatedItem.volumeMl) || 0,
      proteins: Number(updatedItem.proteins) || 0,
      fats: Number(updatedItem.fats) || 0,
      carbohydrates: Number(updatedItem.carbohydrates) || 0,
      kcal: Math.round(Number(updatedItem.kcal)) || 0,
      explanation: String(updatedItem.explanation || '').substring(0, 8192),
      ingredients: (updatedItem.ingredients || []).map(ing => ({
        name: String(ing.name || ''),
        weight: Number(ing.weight) || 0
      })).slice(0, 100),
    };

    if (updatedItem.imageUrl !== undefined) {
      validatedItem.imageUrl = updatedItem.imageUrl;
    }

    try {
      setIsSyncing(true);
      await setDoc(doc(db, 'users', uid, 'meals', id), validatedItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, targetPath);
    } finally {
      setIsSyncing(false);
    }
  };

  // Local calculation aggregates
  const filteredItems = diaryItems.filter((item) => item.date === selectedDate);
  const consumedKcal = filteredItems.reduce((acc, item) => acc + item.kcal, 0);
  const consumedProtein = filteredItems.reduce((acc, item) => acc + item.proteins, 0);
  const consumedFat = filteredItems.reduce((acc, item) => acc + item.fats, 0);
  const consumedCarbs = filteredItems.reduce((acc, item) => acc + item.carbohydrates, 0);

  const totalKcalTarget = profile.targetKcal || 2000;
  const progressPercent = totalKcalTarget > 0 ? Math.round((consumedKcal / totalKcalTarget) * 100) : 0;

  // Real-time BMI and local category classification
  const hM = profile.heightCc / 100;
  const bmiValue = profile.heightCc > 0 && profile.weightCc > 0 ? Number((profile.weightCc / (hM * hM)).toFixed(1)) : 0;
  
  const getBmiCategory = (bmi: number) => {
    if (bmi <= 0) return { label: '', color: 'text-zinc-500', bg: 'bg-zinc-500/10', dotColor: 'bg-zinc-400' };
    if (bmi < 18.5) return { 
      label: lang === 'ua' ? 'Дефіцит ваги' : 'Underweight', 
      color: 'text-sky-500 dark:text-sky-400', 
      bg: 'bg-sky-500/10 dark:bg-sky-400/10',
      dotColor: 'bg-sky-400'
    };
    if (bmi < 25) return { 
      label: lang === 'ua' ? 'Норма' : 'Normal', 
      color: 'text-emerald-500 dark:text-[#89FFA0]', 
      bg: 'bg-emerald-500/10 dark:bg-[#89FFA0]/10',
      dotColor: 'bg-emerald-500 dark:bg-[#89FFA0]'
    };
    if (bmi < 30) return { 
      label: lang === 'ua' ? 'Зайва вага' : 'Overweight', 
      color: 'text-amber-500 dark:text-amber-400', 
      bg: 'bg-amber-500/10 dark:bg-amber-400/10',
      dotColor: 'bg-amber-400'
    };
    return { 
      label: lang === 'ua' ? 'Ожиріння' : 'Obese', 
      color: 'text-rose-500 dark:text-rose-400', 
      bg: 'bg-rose-500/10 dark:bg-rose-450/10',
      dotColor: 'bg-rose-400'
    };
  };
  const bmiCat = getBmiCategory(bmiValue);

  // Selected date water log tracking
  const todayWater = waterLogs[selectedDate] || { amount: 0, target: Math.round((profile.weightCc || 75) * 35) };

  // Render Onboarding loading view
  if (authLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 ${
        isDark ? 'bg-zinc-950 text-white' : 'bg-[#F8FAF9] text-[#1A1C1B]'
      }`}>
        <div className="space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${
              isDark ? 'border-zinc-800 border-t-[#89FFA0]' : 'border-[#DCEEE0] border-t-[#2D5A27]2'
            }`}></div>
            <Sparkles className={`w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse ${
              isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'
            }`} />
          </div>
          <p className="text-sm font-semibold animate-pulse">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Render secure Onboarding/Login screen when user is not signed in
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col lg:flex-row items-stretch font-sans transition-colors duration-300 ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F8FAF9] text-[#1A1C1B]'
      }`}>
        {/* Left column: Visual branding and value proposition */}
        <div className="flex-1 bg-gradient-to-br from-[#2D5A27] via-[#1F3E1B] to-[#142911] text-white p-8 sm:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,238,224,0.15),transparent)] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <GlassmorphicAppleLogo size="lg" theme="dark" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2">
                NutriScan<span className="text-[#89FFA0]">.</span>
              </h1>
              <p className="text-xs text-[#DCEEE0] font-medium mt-1 uppercase tracking-widest">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="my-12 sm:my-20 space-y-8 relative z-10 max-w-lg">
            <h2 className="text-3xl sm:text-5xl font-light leading-tight">
              {lang === 'ua' ? 'Синхронізація вашого харчування на ' : 'Sync your nutrition on '}
              <span className="font-semibold text-[#89FFA0]">{lang === 'ua' ? 'будь-якому пристрої' : 'any device'}</span>
            </h2>
            <p className="text-[#DCEEE0] text-sm sm:text-base leading-relaxed">
              {t.loginDesc}
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xs">
                <Camera className="w-5 h-5 text-[#89FFA0]" />
                <div className="text-left text-xs text-[#DCEEE0]">
                  <strong className="block text-white mb-0.5">{t.photoAnalysis}</strong>
                  {t.photoAnalysisDesc}
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xs">
                <Scale className="w-5 h-5 text-[#89FFA0]" />
                <div className="text-left text-xs text-[#DCEEE0]">
                  <strong className="block text-white mb-0.5">{t.dailyTdee}</strong>
                  {t.dailyTdeeDesc}
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xs">
                <ShieldCheck className="w-5 h-5 text-[#89FFA0]" />
                <div className="text-left text-xs text-[#DCEEE0]">
                  <strong className="block text-white mb-0.5">{t.cloudSync}</strong>
                  {t.cloudSyncDesc}
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#829986] relative z-10">
            NutriScan Security v2.5 • Zero-Trust Firebase Firestore Cloud Integration
          </div>
        </div>

        {/* Right column: Action call */}
        <div className={`w-full lg:w-[480px] p-8 sm:p-12 flex flex-col justify-between items-center border-t lg:border-t-0 lg:border-l transition-colors duration-300 ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-[#E2E8E4]'
        }`}>
          {/* Controls switcher in login column */}
          <div className="w-full flex justify-end gap-1.5 mb-4">
            <button
              onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
              className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'border-zinc-800 text-[#89FFA0] hover:border-zinc-700 bg-zinc-950/40' 
                  : 'border-[#E2E8E4] text-[#2D5A27] hover:border-gray-300 bg-[#F3F7F4]'
              }`}
            >
              {lang === 'ua' ? 'ENG' : 'УКР'}
            </button>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-1.5 px-3 text-xs rounded-xl transition-all cursor-pointer font-bold border ${
                isDark ? 'border-zinc-800 text-amber-300 bg-zinc-950/45' : 'border-[#E2E8E4] text-amber-100 bg-amber-50'
              }`}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="w-full max-w-sm space-y-6 text-center my-auto">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{t.loginTitle}</h2>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{lang === 'ua' ? 'Увійдіть через Google, щоб створити свій щоденник або завантажити ваші попередні збереження.' : 'Sign in via Google to create your diary or load your cloud synchronization.'}</p>
            </div>

            <button
              onClick={handleSignIn}
              id="google-login-btn"
              className={`w-full h-13 font-semibold border-2 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-97 text-sm ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-900' 
                  : 'bg-white hover:bg-[#F8FAF9] text-[#1A1C1B] border-[#E2E8E4] hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.03-1.21-.19-1.67-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.googleLogin}</span>
            </button>

            <div className="text-[11px] text-[#829986] leading-normal pt-4">
              {t.securityNotice}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Main Cloud-Synchronized Workspace (For Logged in Users)
  const isCalculatorPage = showCalculator || !profile.isCalculated;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F8FAF9] text-[#1A1C1B]'
    }`}>
      
      {/* Mobile Backdrop for Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar: User Parameters & Targets */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] h-full flex flex-col p-6 overflow-y-auto shadow-2xl transition-transform duration-300 transform md:transform-none md:relative md:inset-auto md:w-80 md:h-auto md:shadow-none md:flex md:z-10 md:border-b-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#E2E8E4]'}
        border-r
      `}>
        <div className="mb-4 flex justify-between items-start">
          <div className="flex gap-2.5 items-center">
            <GlassmorphicAppleLogo size="sm" theme={isDark ? 'dark' : 'light'} />
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#2D5A27]'}`}>
                NutriScan<span className={isDark ? "text-[#89FFA0]" : "text-[#2D5A27]"}>.</span>
              </h1>
              <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-zinc-500' : 'text-[#4A5D4E]'}`}>{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleCalculator}
              className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                isCalculatorPage
                  ? isDark 
                    ? 'bg-[#89FFA0]/20 border-[#89FFA0]/40 text-[#89FFA0]' 
                    : 'bg-[#DCEEE0]/80 border-[#2D5A27]/20 text-[#2D5A27]'
                  : isDark 
                    ? 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-[#89FFA0]' 
                    : 'bg-[#F3F7F4] hover:bg-[#DCEEE0] text-[#4A5D4E] hover:text-[#2D5A27] border-[#E2E8E4]'
              }`}
              title={lang === 'ua' ? 'Налаштування норми' : 'Calculator settings'}
            >
              <Settings className={`w-4.5 h-4.5 ${isCalculatorPage ? 'animate-pulse' : ''}`} />
            </button>

            {/* mobile-only drawer close trigger */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-2 text-zinc-500 hover:text-rose-500 transition-all cursor-pointer border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl"
              title={lang === 'ua' ? 'Закрити' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Dock: active bilingual switches & visual mode switches */}
        <div className={`mb-4 flex gap-1 p-1 rounded-2xl border ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F8FAF9] border-[#E2E8E4]'
        }`}>
          <button
            onClick={() => setLang('ua')}
            className={`flex-1 py-1 px-2.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
              lang === 'ua'
                ? isDark ? 'bg-[#89FFA0]/20 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27]'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            УКР
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-1 px-2.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
              lang === 'en'
                ? isDark ? 'bg-[#89FFA0]/20 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27]'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            ENG
          </button>
          
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer font-bold ${
              isDark ? 'bg-zinc-800 text-amber-300' : 'bg-amber-100 text-amber-750'
            }`}
          >
            {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Real-time Cloud Sync chip */}
        <div 
          onClick={handleManualSync}
          title={t.clickToSync}
          className={`mb-4 text-[10px] font-semibold flex items-center justify-between py-2 px-3 rounded-xl border cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group ${
            isDark 
              ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-[#89FFA0]/40 hover:bg-zinc-950/60' 
              : 'bg-[#F3F7F4] border-[#E2E8E4] text-[#4A5D4E] hover:border-[#2D5A27]/30 hover:bg-[#ebf2ed]'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
              ) : (
                <Cloud className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`} />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className={`font-bold transition-colors ${isDark ? 'group-hover:text-[#89FFA0]' : 'group-hover:text-[#2D5A27]'}`}>
                {isSyncing ? t.syncing : t.cloudActive}
              </span>
              <span className="text-[8px] font-medium opacity-75">
                {(() => {
                  if (isSyncing) return t.syncing;
                  const diffMs = new Date().getTime() - lastSyncTime.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  if (diffMins < 1) {
                    return t.cloudSyncedJustNow;
                  } else {
                    const hrs = String(lastSyncTime.getHours()).padStart(2, '0');
                    const mins = String(lastSyncTime.getMinutes()).padStart(2, '0');
                    return t.cloudSyncedAt.replace('{0}', `${hrs}:${mins}`);
                  }
                })()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[8px] uppercase tracking-wider font-extrabold opacity-0 group-hover:opacity-60 transition-opacity mr-0.5">
              sync
            </span>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
          </div>
        </div>

        {/* Short Personal targets stats Section */}
        <div className={`rounded-2xl p-4 mb-4 border transition-colors duration-300 ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F3F7F4] border-[#E2E8E4]'
        }`}>
          <h2 className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex justify-between items-center ${
            isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'
          }`}>
            <span>{t.targetGoal}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full lowercase ${
              isDark ? 'bg-[#89FFA0]/10 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27]'
            }`}>
              {profile.goalCc === 'lose' ? t.loseWeight : profile.goalCc === 'gain' ? t.gainWeight : t.maintainWeight}
            </span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium font-sans">{t.weight}</span>
              <span className="font-bold">{profile.weightCc} {lang === 'ua' ? 'кг' : 'kg'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium font-sans">{t.heightAge}</span>
              <span className="font-bold">{profile.heightCc} {lang === 'ua' ? 'см' : 'cm'} / {profile.ageCc} {lang === 'ua' ? 'р.' : 'y.'}</span>
            </div>
            {bmiValue > 0 && (
              <div className="flex justify-between items-center mt-1 pt-1 border-t border-dashed border-zinc-805/10 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium font-sans">{t.bmiValueTitle}</span>
                <span className="font-bold text-xs">
                  {bmiValue} <span className="text-zinc-400 dark:text-zinc-500 font-medium">/ 18.5-24.9</span>
                </span>
              </div>
            )}
            <div className={`h-[1px] my-2 ${isDark ? 'bg-zinc-800' : 'bg-[#E2E8E4]'}`}></div>
            
            <div className="flex justify-between items-baseline pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.kcalBudget}</span>
              <span className={`text-lg font-bold ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`}>{profile.targetKcal} <span className="text-[10px] uppercase font-bold text-zinc-500">{lang === 'ua' ? 'ккал' : 'kcal'}</span></span>
            </div>
            
            <div className="grid grid-cols-3 gap-1 pt-2">
              <div className={`text-center p-1 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white/60 border-[#E2E8E4]'}`}>
                <span className="block text-[8px] uppercase font-bold text-zinc-500">{t.proteins}</span>
                <span className="text-xs font-bold">{profile.targetProtein}{lang === 'ua' ? 'г' : 'g'}</span>
              </div>
              <div className={`text-center p-1 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white/60 border-[#E2E8E4]'}`}>
                <span className="block text-[8px] uppercase font-bold text-zinc-500">{t.fats}</span>
                <span className="text-xs font-bold">{profile.targetFat}{lang === 'ua' ? 'г' : 'g'}</span>
              </div>
              <div className={`text-center p-1 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white/60 border-[#E2E8E4]'}`}>
                <span className="block text-[8px] uppercase font-bold text-zinc-500">{t.carbs}</span>
                <span className="text-xs font-bold">{profile.targetCarbs}{lang === 'ua' ? 'г' : 'g'}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleShowCalculator}
            className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5 ${
              isDark ? 'bg-[#89FFA0] text-zinc-950 hover:bg-[#6be483]' : 'bg-[#2D5A27] text-white hover:bg-[#23471F]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            {t.recalculateGoals}
          </button>

          <button
            onClick={() => {
              setShowAnalytics(prev => {
                const next = !prev;
                if (next) setShowCalculator(false);
                return next;
              });
            }}
            id="view-analytics-toggle"
            className={`hidden md:flex mt-2 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center items-center justify-center gap-1.5 border ${
              showAnalytics
                ? isDark 
                  ? 'bg-amber-950/20 text-amber-400 border-amber-900/40 hover:bg-amber-950/30' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-[#89FFA0] hover:bg-zinc-900' 
                  : 'bg-white text-[#2D5A27] border-[#E2E8E4] hover:bg-[#F3F7F4]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showAnalytics 
              ? (lang === 'ua' ? 'Назад до щоденника' : 'Back to Diary')
              : (lang === 'ua' ? 'Історія та аналітика' : 'History & Analytics')}
          </button>
        </div>
        
        {/* Quick Water Tracker Card */}
        <div className={`rounded-2xl p-4 mb-4 border transition-all duration-300 ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F3F7F4] border-[#E2E8E4]'
        }`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500 animate-[bounce_2.5s_infinite]" />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>
                {t.waterTracker}
              </span>
            </div>
            <span className="text-xs font-extrabold font-mono text-blue-600 dark:text-blue-400">
              {todayWater.amount} <span className="text-zinc-500 text-[10px] font-normal">/ {todayWater.target} {lang === 'ua' ? 'мл' : 'ml'}</span>
            </span>
          </div>

          {/* Liquid progress indicator */}
          <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded-full border ${
            isDark ? 'bg-zinc-900 border-zinc-850' : 'bg-white/70 border-[#E2E8E4]'
          }`}>
            <div 
              style={{ width: `${Math.min(100, (todayWater.amount / todayWater.target) * 100)}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-blue-400 to-sky-400"
            ></div>
          </div>

          {/* Fast logger triggers */}
          <div className="flex gap-1.5 justify-between">
            <button
              onClick={() => handleUpdateWater(selectedDate, 100)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer font-sans active:scale-95 duration-100 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-400/40 hover:text-blue-400' 
                  : 'bg-white border-[#E2E8E4] text-zinc-650 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              +100
            </button>
            <button
              onClick={() => handleUpdateWater(selectedDate, 250)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer font-sans active:scale-95 duration-100 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-400/40 hover:text-blue-400' 
                  : 'bg-white border-[#E2E8E4] text-zinc-650 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              +250
            </button>
            <button
              onClick={() => handleUpdateWater(selectedDate, 500)}
              className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer font-sans active:scale-95 duration-100 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-400/40 hover:text-blue-400' 
                  : 'bg-white border-[#E2E8E4] text-zinc-650 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              +500
            </button>
            
            <button
              onClick={() => handleUpdateWater(selectedDate, 0)}
              title={lang === 'ua' ? 'Очистити воду' : 'Reset water log'}
              className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer active:scale-90 duration-100 flex items-center justify-center ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-450/30' 
                  : 'bg-white border-[#E2E8E4] text-[#8C9890] hover:text-rose-600 hover:border-rose-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sidebar Mini Summary for Today */}
        <div className="mt-2 space-y-3">
          <h2 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.todayProgress}</h2>
          
          <div className="relative pt-1">
            <div className="flex mb-1.5 items-center justify-between">
              <div>
                <span className={`text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full tracking-wider ${
                  isDark ? 'bg-[#89FFA0]/20 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27]'
                }`}>
                  {t.consumedLabel}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`}>{progressPercent}%</span>
              </div>
            </div>
            {/* Minimal Progress Bar */}
            <div className={`overflow-hidden h-2 mb-3 text-xs flex rounded-full border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-[#E2E8E4] border-[#E2E8E4]'}`}>
              <div 
                style={{ width: `${Math.min(100, progressPercent)}%` }} 
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-500 ease-out ${
                  isDark ? 'bg-[#89FFA0]' : 'bg-[#2D5A27]'
                }`}
              ></div>
            </div>
            <p className="text-[10px] text-center text-zinc-500 font-medium">
              {t.consumedOf.replace('{0}', String(consumedKcal)).replace('{1}', String(totalKcalTarget))}
            </p>
          </div>
        </div>

        {/* Secure Account Action segment */}
        <div className={`mt-auto pt-4 border-t space-y-2.5 ${isDark ? 'border-zinc-800' : 'border-[#E2E8E4]'}`}>
          <div className={`flex items-center gap-2.5 p-1 rounded-2xl border ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-[#F8FAF9] border-[#E2E8E4]'
          }`}>
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-zinc-800 object-cover" 
                alt="Профіль" 
              />
            ) : (
              <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-[#89FFA0]' : 'bg-[#DCEEE0] text-[#2D5A27] border-[#E2E8E4]'
              }`}>
                {String(userName || 'К').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold truncate">{userName}</span>
              <span className="block text-[9px] text-zinc-500 truncate font-semibold lowercase tracking-tight">{user.email}</span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            id="google-logout-btn"
            className={`w-full h-10 border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-xl ${
              isDark 
                ? 'bg-zinc-950 hover:bg-red-950/20 border-zinc-805 text-zinc-400 hover:text-red-400' 
                : 'bg-white hover:bg-[#FFF5F5] border-[#E2E8E4] hover:border-red-100 text-[#4A5D4E] hover:text-red-650'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic Header Block with Greeting & Date Actions */}
        <header className={`p-4 sm:p-8 flex-shrink-0 border-b transition-colors duration-300 ${
          isDark ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-[#E2E8E4]'
        }`}>
          {isCalculatorPage ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#2D5A27]'}`}>
                  {lang === 'ua' ? 'Налаштування норми' : 'Target Norm Settings'}
                </h2>
                <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-zinc-450' : 'text-[#4A5D4E]'}`}>
                  {lang === 'ua' ? 'Розрахунок добової потреби калорій КБЖУ та цільових орієнтирів' : 'Calculate daily calorie budget, macro distributions and profile indicators'}
                </p>
              </div>

              {profile.isCalculated && (
                <button
                  onClick={() => setShowCalculator(false)}
                  className={`py-2 px-4 border rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 active:scale-95 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900' : 'bg-white border-[#E2E8E4] text-[#1A1C1B] hover:bg-[#F3F7F4]'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ua' ? 'Назад до щоденника' : 'Back to Diary'}</span>
                </button>
              )}
            </div>
          ) : showAnalytics ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#2D5A27]'}`}>
                  {lang === 'ua' ? 'Історія та аналітика' : 'History & Analytics'}
                </h2>
                <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-zinc-450' : 'text-[#4A5D4E]'}`}>
                  {lang === 'ua' ? 'Моніторинг вашого прогресу, балансу КБЖУ та звичок харчування' : 'Track your nutrition milestones, calorie budgets, and habits'}
                </p>
              </div>

              <button
                onClick={() => setShowAnalytics(false)}
                className={`py-2 px-4 border rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 active:scale-95 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900' : 'bg-white border-[#E2E8E4] text-[#1A1C1B] hover:bg-[#F3F7F4]'
                }`}
              >
                <ChevronLeft className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'ua' ? 'Назад до щоденника' : 'Back to Diary'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              
              {/* User Custom Greetings */}
              <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-3 justify-between w-full sm:w-auto">
                <div className="flex-1">
                  <div className="flex items-center gap-2 group">
                    <h2 className={`text-2xl sm:text-3xl font-light ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      {t.welcome}{' '}
                      {isEditingName ? (
                        <input
                          type="text"
                          id="username-edit-input"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          onBlur={() => saveName(userName)}
                          onKeyDown={(e) => e.key === 'Enter' && saveName(userName)}
                          autoFocus
                          placeholder={t.renameInputPlaceholder}
                          className={`font-semibold border-b focus:outline-none px-1 py-0.5 rounded text-xl sm:text-2xl max-w-[150px] ${
                            isDark ? 'text-white border-[#89FFA0] bg-zinc-950/40' : 'text-black border-[#2D5A27] bg-zinc-50'
                          }`}
                        />
                      ) : (
                        <span 
                          onClick={() => setIsEditingName(true)}
                          className={`font-semibold border-b border-dashed cursor-pointer title-edit ${
                            isDark 
                              ? 'text-white border-zinc-750 hover:border-[#89FFA0]' 
                              : 'text-[#1A1C1B] border-gray-300 hover:border-[#2D5A27]'
                          }`}
                          title={t.clickToRename}
                        >
                          {userName}
                        </span>
                      )}
                    </h2>
                  </div>
                  <p className={`text-xs font-medium mt-1 ${isDark ? 'text-zinc-400' : 'text-[#4A5D4E]'}`}>{t.welcomeSub}</p>
                </div>

                {/* Mobile-only Actions Column (stacked) */}
                <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 md:hidden">
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer w-full ${
                      isDark 
                        ? 'bg-[#89FFA0]/10 border-[#89FFA0]/20 text-[#89FFA0] hover:bg-[#89FFA0]/20' 
                        : 'bg-[#DCEEE0]/80 border-[#2D5A27]/20 text-[#2D5A27] hover:bg-[#DCEEE0]'
                    }`}
                  >
                    <Scale className="w-4 h-4 text-emerald-555 dark:text-[#89FFA0]" />
                    <span>{lang === 'ua' ? 'Цілі та Норми' : 'Goals & Targets'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAnalytics(prev => {
                        const next = !prev;
                        if (next) setShowCalculator(false);
                        return next;
                      });
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer w-full ${
                      showAnalytics
                        ? isDark 
                          ? 'bg-amber-950/20 text-amber-400 border-amber-900/40 hover:bg-amber-950/30' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : isDark 
                          ? 'bg-zinc-900 border-zinc-850 text-[#89FFA0] hover:bg-zinc-850' 
                          : 'bg-white text-[#2D5A27] border-[#E2E8E4] hover:bg-[#F3F7F4]'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-550 dark:text-[#89FFA0]" />
                    <span>
                      {showAnalytics 
                        ? (lang === 'ua' ? 'Назад до щоденника' : 'Back to Diary')
                        : (lang === 'ua' ? 'Історія та аналітика' : 'History & Analytics')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Date-Picker Controls Selection */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => handleOffsetDate(-1)}
                  className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-95 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900' : 'bg-white border-[#E2E8E4] text-[#1A1C1B] hover:bg-[#F3F7F4]'
                  }`}
                  title={t.prevDay}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className={`relative flex items-center border px-3.5 py-1.5 rounded-xl gap-2 shadow-xs group font-semibold text-sm cursor-pointer ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-[#E2E8E4] text-[#1A1C1B]'
                }`}>
                  <Calendar className={`w-4 h-4 shrink-0 col-span-1 ${isDark ? 'text-[#89FFA0]' : 'text-[#2D5A27]'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider select-none pr-1 ${isDark ? 'text-white' : 'text-[#1A1C1B]'}`}>
                    {(() => {
                      if (!selectedDate) return '';
                      const parts = selectedDate.split('-');
                      if (parts.length === 3) {
                        return `${parts[2]}.${parts[1]}.${parts[0]}`;
                      }
                      return selectedDate;
                    })()}
                  </span>
                  <input
                    type="date"
                    id="date-picker-input"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => handleOffsetDate(1)}
                  className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-95 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900' : 'bg-white border-[#E2E8E4] text-[#1A1C1B] hover:bg-[#F3F7F4]'
                  }`}
                  title={t.nextDay}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </header>

        {/* Dynamic Main Workspace content structure */}
        <div className="p-4 sm:p-8 space-y-6">
          
          {isCalculatorPage ? (
            <div className="animate-fadeIn">
              <TdeeCalculator
                currentProfile={profile}
                onSaveProfile={handleSaveProfile}
                lang={lang}
                theme={theme}
                onCancel={profile.isCalculated ? () => setShowCalculator(false) : undefined}
              />
              {!profile.isCalculated && (
                <div className={`max-w-2xl mx-auto mt-3 p-4 rounded-2xl text-xs flex gap-2 border leading-relaxed ${
                  isDark 
                    ? 'bg-[#89FFA0]/10 text-[#89FFA0] border-zinc-800' 
                    : 'bg-[#DCEEE0]/40 text-[#2D5A27] border-[#E2E8E4]'
                }`}>
                  <Info className="w-4.5 h-4.5 shrink-0" />
                  <p>
                    <strong>{lang === 'ua' ? 'Увага:' : 'Attention:'}</strong> {t.calculatorNotice}
                  </p>
                </div>
              )}
            </div>
          ) : showAnalytics ? (
            <div className="animate-fadeIn">
              <HistoryAnalytics 
                diaryItems={diaryItems}
                profile={profile}
                lang={lang}
                theme={theme}
              />
            </div>
          ) : (
            <>
              {/* Interactive Core grid: Photo Scan + Summary logs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Photo Scan block */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                  <FoodUploader 
                    activeDate={selectedDate} 
                    onSaveFoodItem={handleSaveFoodItem} 
                    lang={lang}
                    theme={theme}
                  />
                  
                  <DailyStats 
                    targetKcal={profile.targetKcal || 2300}
                    targetProtein={profile.targetProtein || 120}
                    targetFat={profile.targetFat || 70}
                    targetCarbs={profile.targetCarbs || 270}
                    consumedKcal={consumedKcal}
                    consumedProtein={consumedProtein}
                    consumedFat={consumedFat}
                    consumedCarbs={consumedCarbs}
                    lang={lang}
                    theme={theme}
                  />
                </div>

                {/* Daily History sidebar/log column */}
                <div className="lg:col-span-12 xl:col-span-5 h-full">
                  <FoodDiaryList 
                    items={filteredItems} 
                    onDeleteItem={handleDeleteFoodItem} 
                    onUpdateItem={handleUpdateFoodItem}
                    selectedDate={selectedDate}
                    lang={lang}
                    theme={theme}
                  />
                </div>

              </div>
            </>
          )}

          {/* Footer attribution */}
          <footer className={`mt-8 pt-6 border-t text-center text-xs font-medium transition-colors ${
            isDark 
              ? 'border-zinc-900 text-zinc-500 hover:text-zinc-400' 
              : 'border-[#E2E8E4] text-gray-500 hover:text-gray-700'
          }`}>
            <span>
              {lang === 'ua' ? 'Автор: ' : 'Author: '}
              <a 
                href="https://github.com/ivandidenkoweb" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-bold underline transition-colors hover:text-[#2D5A27] dark:hover:text-[#89FFA0]"
              >
                Ivan Didenko
              </a>
            </span>
          </footer>

        </div>

      </main>
    </div>
  );
}
