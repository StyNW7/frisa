import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/store/AppContext'
import { ToastProvider } from '@/store/ToastContext'
import { UiProvider } from '@/store/UiContext'
import { MobileAppShell } from '@/components/common/MobileAppShell'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useApp } from '@/hooks/useApp'

import { SplashPage } from '@/pages/SplashPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { SetupPage } from '@/pages/SetupPage'
import { HomePage } from '@/pages/HomePage'
import { InventoryPage } from '@/pages/InventoryPage'
import { FoodDetailPage } from '@/pages/FoodDetailPage'
import { ScanPage } from '@/pages/ScanPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { FridgesPage } from '@/pages/FridgesPage'
import { DevicePage } from '@/pages/DevicePage'
import { ShoppingListPage } from '@/pages/ShoppingListPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SkeletonBlock } from '@/components/common/Feedback'

/* Recharts is only needed on Insights, so it loads when the tab is first opened. */
const InsightsPage = lazy(() =>
  import('@/pages/InsightsPage').then((module) => ({ default: module.InsightsPage })),
)

function InsightsFallback() {
  return (
    <div className="space-y-4 px-5 pt-6">
      <SkeletonBlock className="h-[132px]" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-[116px]" />
        <SkeletonBlock className="h-[116px]" />
      </div>
      <SkeletonBlock className="h-[240px]" />
    </div>
  )
}

/** Keeps the guided flow intact: the app proper is only reachable after setup. */
function RequireSetup({ children }: { children: React.ReactNode }) {
  const { setupDone } = useApp()
  if (!setupDone) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <UiProvider>
            <Routes>
              <Route path="/" element={<SplashPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/setup" element={<SetupPage />} />

              <Route
                element={
                  <RequireSetup>
                    <MobileAppShell />
                  </RequireSetup>
                }
              >
                <Route path="/home" element={<HomePage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route
                  path="/insights"
                  element={
                    <Suspense fallback={<InsightsFallback />}>
                      <InsightsPage />
                    </Suspense>
                  }
                />
                <Route path="/food/:id" element={<FoodDetailPage />} />
                <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/fridges" element={<FridgesPage />} />
                <Route path="/device" element={<DevicePage />} />
                <Route path="/shopping" element={<ShoppingListPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </UiProvider>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
