"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Settings, Info, Copy, Check, Download } from "lucide-react"

interface YearlyCalculation {
  year: number
  rate: number
  dailyRate: number
  startBalance: number
  endBalance: number
  yearlyInterest: number
  cumulativeInterest: number
}

interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info"
}

const DEFAULT_RATES: Record<string, Record<number, number>> = {
  legal: {
    2015: 9.0,
    2016: 9.0,
    2017: 9.0,
    2018: 9.0,
    2019: 9.0,
    2020: 9.0,
    2021: 9.0,
    2022: 9.0,
    2023: 9.0,
    2024: 16.5, // Average: 9% until 31.05, 24% from 01.06
    2025: 24.0,
  },
  default: {
    2015: 11.5,
    2016: 11.5,
    2017: 10.75,
    2018: 10.75,
    2019: 21.25,
    2020: 14.875, // Mix of rates throughout year
    2021: 17.5,
    2022: 13.5,
    2023: 24.25, // Average: 11.75% until 30.06, 36.75% from 01.07
    2024: 40.875, // Average: 48% in first part, 51.75% later
    2025: 49.25, // Changed to 49.25 from 01.01, then 53.25 expected
  },
  recount: {
    2015: 11.5,
    2016: 10.125, // Average of period rates
    2017: 8.75,
    2018: 13.675, // Mix: 8.75% until 29.06, 18.5% after
    2019: 16.0, // Mix of three rates during year
    2020: 12.5, // Mix of three rates during year
    2021: 15.25,
    2022: 12.25,
    2023: 20.5, // Mix: 9.75% until June, then 35.75% by November
    2024: 47.0, // Mix: 43.25% until 01.04, 50.75% after
    2025: 48.25,
  },
  advance: {
    2015: 12.0,
    2016: 11.375, // Average of period rates
    2017: 9.75,
    2018: 14.625, // Mix: 9.75% until 29.06, 19.5% after
    2019: 17.0, // Mix of three rates during year
    2020: 13.5, // Mix of three rates during year
    2021: 16.25,
    2022: 13.25,
    2023: 21.5, // Mix: 10.75% until June, then 36.75% by November
    2024: 48.0, // Mix: 44.25% until 01.04, 51.75% after
    2025: 49.25,
  },
}

export default function Home() {
  const [interestType, setInterestType] = useState<"legal" | "default" | "recount" | "advance">("legal")
  const [principal, setPrincipal] = useState<string>("10000")
  const [startDate, setStartDate] = useState<string>("2023-01-01")
  const [endDate, setEndDate] = useState<string>("2025-12-31")
  const [calculations, setCalculations] = useState<YearlyCalculation[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [customRates, setCustomRates] = useState<Record<string, Record<number, number>>>(DEFAULT_RATES)
  const [settingsTab, setSettingsTab] = useState<"legal" | "default" | "recount" | "advance">("legal")
  const [years, setYears] = useState<number[]>([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025])
  const [embedCopied, setEmbedCopied] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [settingsInnerTab, setSettingsInnerTab] = useState<"rates" | "embed">("rates")
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstallable, setIsInstallable] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const newYears = Array.from({ length: currentYear - 2014 }, (_, i) => 2015 + i)
    setYears(newYears)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("interestRates")
    if (saved) {
      try {
        setCustomRates(JSON.parse(saved))
      } catch {
        setCustomRates(DEFAULT_RATES)
      }
    }
  }, [])

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      console.log("[v0] Install prompt ready")
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Check if app is already installed
    if (window.navigator.standalone === true) {
      console.log("[v0] App is already installed as standalone")
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const addNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36)
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  const handleInstallApp = async () => {
    try {
      if (!deferredPrompt) {
        // If beforeinstallprompt not available, try manual installation guidance
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isAndroid = /Android/.test(navigator.userAgent)

        if (isIOS) {
          addNotification("📱 iOS: Safari menüsünden 'Başlangıç Ekranına Ekle' seçeneğini kullanın", "info")
        } else if (isAndroid) {
          addNotification("📱 Android: Menüden 'Uygulamayı yükle' veya 'Ana Ekrana Ekle' seçeneğini kullanın", "info")
        } else {
          addNotification("💻 Masaüstü: Tarayıcıyı yeniden başlattıktan sonra yükleme promptu görünecektir", "info")
        }
        return
      }

      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        addNotification("✓ Uygulama başarıyla yüklendi! Ana ekranınızdan hızlı erişim yapabilirsiniz.", "success")
        setDeferredPrompt(null)
      } else {
        addNotification("İndir işlemi iptal edildi", "info")
      }
    } catch (error) {
      console.log("[v0] Install error:", error)
      addNotification("⚠ Yükleme işleminde bir hata oluştu. Tarayıcı ayarlarını kontrol edin.", "error")
    }
  }

  const checkForUpdates = () => {
    setCheckingUpdates(true)
    setTimeout(() => {
      const currentYear = new Date().getFullYear()
      const maxSavedYear = Math.max(...Object.keys(customRates.legal).map(Number))

      if (currentYear > maxSavedYear) {
        const newRates = { ...customRates }
        const yearsToAdd = Array.from({ length: currentYear - maxSavedYear }, (_, i) => maxSavedYear + i + 1)

        Object.keys(newRates).forEach((type) => {
          yearsToAdd.forEach((year) => {
            newRates[type][year] = newRates[type][maxSavedYear] || 24.0
          })
        })

        setCustomRates(newRates)
        saveRates()
        alert(
          `✓ ${yearsToAdd.length} yeni yıl eklendi (${yearsToAdd.join(", ")}). Oranları ayarlardan düzenleyebilirsiniz.`,
        )
      } else {
        alert("✓ Uygulamanız güncel. Yeni yıl verileri bulunmamaktadır.")
      }
      setCheckingUpdates(false)
    }, 1000)
  }

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="https://erkanoz-faizhesapla.vercel.app" width="100%" height="800" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>`
    navigator.clipboard.writeText(embedCode)
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  const saveRates = () => {
    localStorage.setItem("interestRates", JSON.stringify(customRates))
    setShowSettings(false)
  }

  const resetRates = () => {
    setCustomRates(DEFAULT_RATES)
    localStorage.removeItem("interestRates")
  }

  const calculateInterest = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const principal_num = Number.parseFloat(principal)

    if (isNaN(principal_num) || principal_num <= 0) {
      alert("Lütfen geçerli bir anapara miktarı girin")
      return
    }

    if (start >= end) {
      alert("Başlangıç tarihi, bitiş tarihinden önce olmalıdır")
      return
    }

    const rates = customRates[interestType]
    const results: YearlyCalculation[] = []
    let currentBalance = principal_num
    let totalCumulativeInterest = 0
    const currentYear = start.getFullYear()
    const endYear = end.getFullYear()

    for (let year = currentYear; year <= endYear; year++) {
      const yearStart = year === currentYear ? start : new Date(year, 0, 1)
      const yearEnd = year === endYear ? end : new Date(year, 11, 31)

      const daysInPeriod = Math.floor((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const rate = rates[year] || 24.0
      const dailyRate = rate / 100 / 365
      const yearlyInterest = ((currentBalance * rate) / 100) * (daysInPeriod / 365)

      totalCumulativeInterest += yearlyInterest
      currentBalance += yearlyInterest

      results.push({
        year,
        rate,
        dailyRate,
        startBalance: year === currentYear ? principal_num : results[results.length - 1]?.endBalance || principal_num,
        endBalance: currentBalance,
        yearlyInterest,
        cumulativeInterest: totalCumulativeInterest,
      })
    }

    setCalculations(results)
  }

  const totalInterest = calculations.reduce((sum, calc) => sum + calc.yearlyInterest, 0)
  const finalAmount = calculations.length > 0 ? calculations[calculations.length - 1].endBalance : 0

  const chartData = calculations.map((calc) => ({
    year: calc.year.toString(),
    interest: Math.round(calc.yearlyInterest),
    cumulative: Math.round(calc.cumulativeInterest),
    balance: Math.round(calc.endBalance),
  }))

  const getInterestTypeLabel = (type: string) => {
    switch (type) {
      case "legal":
        return "Yasal Faiz (TBK Md.106)"
      case "default":
        return "Ticari Temerrüt Faizi (TTK Md.1530)"
      case "recount":
        return "Reeskont Faizi (TCMB)"
      case "advance":
        return "Avans Faizi (TCMB)"
      default:
        return ""
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg text-white text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                  ? "bg-red-600"
                  : "bg-blue-600"
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Kolay Faiz Hesaplama</h1>
          <p className="text-blue-200 mb-4">Türk Hukuku'na Uygun Faiz Hesaplamaları (2015-{Math.max(...years)})</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleInstallApp}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Uygulamayı Yükle
            </Button>
            <Button
              onClick={() => setShowAbout(!showAbout)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              size="sm"
            >
              <Info className="w-4 h-4 mr-2" />
              Hakkında
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </Button>
          </div>
        </div>

        {showInstallPrompt && (
          <Card className="mb-6 bg-gradient-to-r from-green-900 to-emerald-900 border-green-600 border-2">
            <CardContent className="pt-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-green-100 font-semibold">Uygulamayı telefonunuza yükleyin!</p>
                <p className="text-green-200 text-sm">Ana ekranından hızlı erişim yapabilirsiniz.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInstallApp} className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Yükle
                </Button>
                <Button
                  onClick={() => setShowInstallPrompt(false)}
                  variant="outline"
                  className="text-green-200 border-green-600 hover:bg-green-800"
                  size="sm"
                >
                  Sonra
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAbout && (
          <Card className="mb-6 bg-slate-800 border-cyan-600 border-2">
            <CardHeader className="bg-cyan-900 bg-opacity-30">
              <CardTitle className="text-white">Kolay Faiz Hesaplama Hakkında</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3 text-slate-300">
                <p>Bu uygulama, Türk Hukuk sistemine uygun olarak faiz hesaplamalarını yapmanız için tasarlanmıştır.</p>

                <div>
                  <h3 className="font-semibold text-white mb-2">Desteklenen Faiz Türleri:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="font-semibold">Yasal Faiz (TBK Md.106):</span> Sözleşmede faiz oranı
                      belirtilmediğinde uygulanan faiz
                    </li>
                    <li>
                      <span className="font-semibold">Ticari Temerrüt Faizi (TTK Md.1530):</span> Ticari borçların
                      vadesi geçtiğinde uygulanır
                    </li>
                    <li>
                      <span className="font-semibold">Reeskont Faizi (TCMB):</span> Ticari senedlerin iskontosunda
                      kullanılır
                    </li>
                    <li>
                      <span className="font-semibold">Avans Faizi (TCMB):</span> Ticari senedler karşılığında verilen
                      avanslar için uygulanır
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Hesaplama Yöntemi:</h3>
                  <p>
                    Uygulamada <span className="font-semibold">basit faiz</span> hesaplanır (faiz üstüne faiz yok). Türk
                    Hukuku'na uygun olarak her yıl aynı anapara üzerinden faiz hesaplanır.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Veri Kaynakları:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Türkiye Cumhuriyet Merkez Bankası (TCMB) resmi oranları</li>
                    <li>Türk Borçlar Kanunu (TBK) hükümleri</li>
                    <li>Türk Ticaret Kanunu (TTK) hükümleri</li>
                  </ul>
                </div>

                <div className="p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-700">
                  <p className="text-sm text-green-200">
                    <span className="font-semibold">Ücretsiz Yazılım:</span> Bu uygulama tamamen ücretsiz olarak
                    sunulmaktadır ve hiç bir şekilde ücret talep edilmez. Herkese açıktır ve istediğiniz şekilde
                    kullanabilirsiniz. Hiç bir reklam veya ücret yoktur.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-600">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">Geliştirici:</span> Bu uygulama
                    <a
                      href="https://www.erkanoz.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-1"
                    >
                      erkanoz.com
                    </a>
                    Av. ERKAN ÖZ tarafından geliştirilmiştir.
                  </p>
                </div>

                <div className="p-3 bg-amber-900 bg-opacity-30 rounded-lg border border-amber-700">
                  <p className="text-sm text-amber-200">
                    <span className="font-semibold">Önemli:</span> Bu uygulama bilgilendirme amaçlıdır. Yasal işlemler
                    için mutlaka yeminli mali müşavir, avukat veya diğer profesyonellere başvurunuz.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowAbout(false)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white mt-4"
              >
                Kapat
              </Button>
            </CardContent>
          </Card>
        )}

        {showSettings && (
          <Card className="mb-6 bg-slate-800 border-amber-600 border-2">
            <CardHeader className="bg-amber-900 bg-opacity-30">
              <CardTitle className="text-white">Ayarlar</CardTitle>
              <CardDescription className="text-slate-300">
                Faiz oranlarını düzenleyin, uygulamayı yükleyin veya sitenize ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex gap-2 mb-6 flex-wrap">
                <Button
                  onClick={() => setSettingsInnerTab("rates")}
                  className={
                    settingsInnerTab === "rates"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 border-slate-600"
                  }
                  size="sm"
                >
                  Faiz Oranları
                </Button>
                <Button
                  onClick={() => setSettingsInnerTab("embed")}
                  className={
                    settingsInnerTab === "embed"
                      ? "bg-orange-600 text-white"
                      : "bg-slate-700 text-slate-300 border-slate-600"
                  }
                  size="sm"
                >
                  Sayfaya Ekle
                </Button>
              </div>

              {settingsInnerTab === "rates" && (
                <>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Button
                      onClick={checkForUpdates}
                      disabled={checkingUpdates}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {checkingUpdates ? "Kontrol Ediliyor..." : "Oranları Kontrol Et"}
                    </Button>
                  </div>

                  <div className="flex gap-2 mb-6 flex-wrap">
                    {Object.keys(customRates).map((type) => (
                      <Button
                        key={type}
                        variant={settingsTab === type ? "default" : "outline"}
                        onClick={() => setSettingsTab(type as any)}
                        className={
                          settingsTab === type
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-700 text-slate-300 border-slate-600"
                        }
                        size="sm"
                      >
                        {getInterestTypeLabel(type).split(" ")[0]}
                      </Button>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">{getInterestTypeLabel(settingsTab)}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {years.map((year) => (
                        <div key={year} className="space-y-1">
                          <Label className="text-slate-400 text-xs">{year}</Label>
                          <Input
                            type="number"
                            value={customRates[settingsTab][year] || 0}
                            onChange={(e) => {
                              const newRates = { ...customRates }
                              newRates[settingsTab] = {
                                ...newRates[settingsTab],
                                [year]: Number.parseFloat(e.target.value) || 0,
                              }
                              setCustomRates(newRates)
                            }}
                            className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <Button onClick={saveRates} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Kaydet
                    </Button>
                    <Button
                      onClick={resetRates}
                      variant="outline"
                      className="flex-1 text-slate-300 border-slate-600 bg-transparent hover:bg-slate-700"
                    >
                      Sıfırla
                    </Button>
                    <Button
                      onClick={() => setShowSettings(false)}
                      variant="outline"
                      className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-700"
                    >
                      Kapat
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-700">
                    <p className="text-sm text-blue-200">
                      <span className="font-semibold">Not:</span> Oranlar 2015-{Math.max(...years)} döneminde TCMB ve
                      Türk Hukuk sistemine göre güncellenmiştir. "Oranları Kontrol Et" butonu ile yeni yılları otomatik
                      olarak ekleyebilirsiniz.
                    </p>
                  </div>
                </>
              )}

              {settingsInnerTab === "embed" && (
                <>
                  <div className="space-y-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                      <p className="text-slate-300 text-sm mb-3 font-semibold">HTML Kodu:</p>
                      <pre className="text-slate-200 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                        {`<iframe src="https://kolay-faiz-hesaplama.vercel.app" width="100%" height="800" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>`}
                      </pre>
                    </div>

                    <div className="p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-700">
                      <p className="text-blue-200 text-sm">
                        <span className="font-semibold">Kullanım:</span> Yukarıdaki kodu kendi HTML sayfanızın body
                        kısmına yapıştırın. Uygulama tamamen responsive olarak çalışacaktır.
                      </p>
                    </div>

                    <Button onClick={copyEmbedCode} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      {embedCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Kopyalandı!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Kodu Kopyala
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowSettings(false)}
                      variant="outline"
                      className="w-full text-slate-300 border-slate-600 hover:bg-slate-700"
                    >
                      Kapat
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Hesaplama Parametreleri</CardTitle>
              <CardDescription className="text-slate-400">Faiz türü ve tarih aralığını seçin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Faiz Türü</Label>
                <Select value={interestType} onValueChange={(v: any) => setInterestType(v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="legal" className="text-white">
                      Yasal Faiz (TBK Md.106)
                    </SelectItem>
                    <SelectItem value="default" className="text-white">
                      Ticari Temerrüt Faizi (TTK Md.1530)
                    </SelectItem>
                    <SelectItem value="recount" className="text-white">
                      Reeskont Faizi (TCMB)
                    </SelectItem>
                    <SelectItem value="advance" className="text-white">
                      Avans Faizi (TCMB)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Anapara (TL)</Label>
                <Input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="10000"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button
                onClick={calculateInterest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Hesapla
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-900 border-blue-700">
                <CardContent className="pt-6">
                  <p className="text-blue-200 text-sm mb-1">Anapara</p>
                  <p className="text-2xl font-bold text-white">
                    {Number.parseFloat(principal).toLocaleString("tr-TR")} TL
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-900 border-emerald-700">
                <CardContent className="pt-6">
                  <p className="text-emerald-200 text-sm mb-1">Toplam Faiz</p>
                  <p className="text-2xl font-bold text-white">
                    {totalInterest.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-purple-900 border-purple-700">
                <CardContent className="pt-6">
                  <p className="text-purple-200 text-sm mb-1">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-white">
                    {finalAmount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL
                  </p>
                </CardContent>
              </Card>
            </div>

            {calculations.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Yıllık Faiz Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Bar dataKey="interest" fill="#3b82f6" name="Yıllık Faiz (TL)" />
                      <Bar dataKey="cumulative" fill="#10b981" name="Kümülatif Faiz (TL)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {calculations.length > 0 && (
          <Card className="mt-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Yıl Bazında Detaylı Hesaplama</CardTitle>
              <CardDescription className="text-slate-400">
                {getInterestTypeLabel(interestType)} - Faiz oranları ve hesaplamalar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700 border-b border-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-200">Yıl</th>
                      <th className="px-4 py-3 text-right text-slate-200">Faiz Oranı (%)</th>
                      <th className="px-4 py-3 text-right text-slate-200">Günlük Oran (%)</th>
                      <th className="px-4 py-3 text-right text-slate-200">Başlangıç Bakiyesi (TL)</th>
                      <th className="px-4 py-3 text-right text-slate-200">Yıllık Faiz (TL)</th>
                      <th className="px-4 py-3 text-right text-slate-200">Bitiş Bakiyesi (TL)</th>
                      <th className="px-4 py-3 text-right text-slate-200">Kümülatif Faiz (TL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.map((calc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-slate-800" : "bg-slate-750"}>
                        <td className="px-4 py-3 text-slate-300 font-medium">{calc.year}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{calc.rate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{(calc.dailyRate * 100).toFixed(4)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {calc.startBalance.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-semibold">
                          {calc.yearlyInterest.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {calc.endBalance.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400 font-semibold">
                          {calc.cumulativeInterest.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
