import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "dashboard" | "schedule" | "stats" | "settings" | "alerts";

const ILLUSTRATION = "https://cdn.poehali.dev/projects/0afda543-c5d3-45c9-bca4-953218fc2825/files/c4d18118-d972-42e5-a1cd-cddf5adf785f.jpg";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const zones = [
  { id: 1, name: "Грядка томатов", icon: "🍅", moisture: 68, status: "active", nextWatering: "сегодня 18:00", lastWatered: "2 часа назад" },
  { id: 2, name: "Газон передний", icon: "🌿", moisture: 42, status: "dry", nextWatering: "сегодня 20:00", lastWatered: "вчера" },
  { id: 3, name: "Цветники", icon: "🌸", moisture: 75, status: "good", nextWatering: "завтра 08:00", lastWatered: "3 часа назад" },
  { id: 4, name: "Теплица", icon: "🥒", moisture: 55, status: "good", nextWatering: "завтра 09:00", lastWatered: "5 часов назад" },
];

const logs = [
  { id: 1, time: "10:30", date: "сегодня", zone: "Грядка томатов", duration: "12 мин", volume: "24 л", type: "auto" },
  { id: 2, time: "08:00", date: "сегодня", zone: "Цветники", duration: "8 мин", volume: "16 л", type: "auto" },
  { id: 3, time: "20:15", date: "вчера", zone: "Газон передний", duration: "20 мин", volume: "60 л", type: "manual" },
  { id: 4, time: "18:00", date: "вчера", zone: "Грядка томатов", duration: "10 мин", volume: "20 л", type: "smart" },
  { id: 5, time: "09:00", date: "2 дня назад", zone: "Теплица", duration: "15 мин", volume: "30 л", type: "auto" },
];

const weekStats = [
  { day: "Пн", liters: 85 },
  { day: "Вт", liters: 62 },
  { day: "Ср", liters: 110 },
  { day: "Чт", liters: 45 },
  { day: "Пт", liters: 95 },
  { day: "Сб", liters: 120 },
  { day: "Вс", liters: 78 },
];

const alerts = [
  { id: 1, type: "warning", title: "Низкая влажность — Газон передний", desc: "Влажность упала до 42%. Рекомендуется полив.", time: "30 мин назад", icon: "Droplets" },
  { id: 2, type: "info", title: "Умный сценарий активирован", desc: "Дождь ожидается через 2 часа, полив перенесён.", time: "1 час назад", icon: "CloudRain" },
  { id: 3, type: "maintenance", title: "Техническое обслуживание", desc: "Рекомендуется очистить фильтры системы (срок: 14 дней).", time: "3 дня назад", icon: "Wrench" },
  { id: 4, type: "success", title: "Полив завершён успешно", desc: "Все зоны политы по расписанию. Расход: 100 л.", time: "5 часов назад", icon: "CheckCircle" },
];

const schedule = [
  { id: 1, zone: "Грядка томатов", icon: "🍅", days: ["Пн", "Ср", "Пт"], time: "18:00", duration: 12, enabled: true },
  { id: 2, zone: "Газон передний", icon: "🌿", days: ["Вт", "Чт", "Сб", "Вс"], time: "20:00", duration: 20, enabled: true },
  { id: 3, zone: "Цветники", icon: "🌸", days: ["Пн", "Ср", "Пт"], time: "08:00", duration: 8, enabled: true },
  { id: 4, zone: "Теплица", icon: "🥒", days: ["Пн", "Вт", "Ср", "Чт", "Пт"], time: "09:00", duration: 15, enabled: false },
];

const ALL_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// ─── Helper Components ───────────────────────────────────────────────────────

function MoistureRing({ value, size = 90 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const color = value < 45 ? "#e07050" : value < 65 ? "#c09040" : "#4a8c5c";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(42,20%,88%)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Полив", cls: "bg-blue-100 text-blue-700" },
    dry: { label: "Сухо", cls: "bg-orange-100 text-orange-700" },
    good: { label: "Норма", cls: "bg-green-100 text-green-700" },
  };
  const { label, cls } = map[status] || map.good;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard() {
  const totalLitersToday = 100;
  const activeZones = zones.filter(z => z.status === "active").length;
  const avgMoisture = Math.round(zones.reduce((a, z) => a + z.moisture, 0) / zones.length);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl" style={{ background: "linear-gradient(135deg, hsl(142,35%,24%) 0%, hsl(168,40%,30%) 60%, hsl(142,30%,20%) 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          <img src={ILLUSTRATION} alt="" className="w-full h-full object-cover object-center" />
        </div>
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-body" style={{ color: "hsl(85,30%,75%)" }}>Сад · Сегодня, 15 мая</p>
              <h2 className="font-display text-5xl font-light mt-1" style={{ color: "hsl(42,30%,96%)" }}>
                Хороший день<br /><em>для полива</em>
              </h2>
              <p className="text-sm mt-3 font-body" style={{ color: "hsl(85,20%,80%)" }}>
                Ожидается +18°C, влажность воздуха 62%
              </p>
            </div>
            <div className="text-right">
              <div className="text-6xl animate-leaf">🌿</div>
              <p className="text-xs mt-2 font-body" style={{ color: "hsl(85,20%,70%)" }}>Дождь через 4 ч</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "Зон активно", value: activeZones, icon: "Zap", unit: "" },
              { label: "Потрачено воды", value: totalLitersToday, icon: "Droplets", unit: "л" },
              { label: "Средняя влажность", value: avgMoisture, icon: "Leaf", unit: "%" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "hsla(42,30%,96%,0.12)", backdropFilter: "blur(10px)" }}>
                <Icon name={s.icon} size={18} style={{ color: "hsl(85,30%,72%)" }} />
                <p className="font-display text-3xl font-light mt-2" style={{ color: "hsl(42,30%,96%)" }}>
                  {s.value}<span className="text-lg">{s.unit}</span>
                </p>
                <p className="text-xs font-body mt-1" style={{ color: "hsl(85,20%,72%)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart scenario banner */}
      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg, hsla(200,55%,48%,0.15) 0%, hsla(185,25%,88%,0.5) 100%)", border: "1px solid hsla(200,55%,48%,0.25)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsla(200,55%,48%,0.2)" }}>
          <Icon name="Brain" size={20} style={{ color: "hsl(200,55%,40%)" }} />
        </div>
        <div className="flex-1">
          <p className="font-body font-medium text-sm" style={{ color: "hsl(30,25%,15%)" }}>Умный сценарий активен</p>
          <p className="text-xs mt-0.5" style={{ color: "hsl(30,15%,45%)" }}>Полив скорректирован из-за ожидаемого дождя — экономия 40 л</p>
        </div>
        <Icon name="ChevronRight" size={16} style={{ color: "hsl(200,55%,48%)" }} />
      </div>

      {/* Zones */}
      <div>
        <h3 className="font-display text-2xl font-light mb-4" style={{ color: "hsl(30,25%,15%)" }}>Зоны полива</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {zones.map((zone, i) => (
            <div
              key={zone.id}
              className="rounded-2xl p-5 forest-card animate-fade-up cursor-pointer hover:shadow-md transition-all"
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{zone.icon}</span>
                  <div>
                    <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>{zone.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(30,15%,50%)" }}>Следующий: {zone.nextWatering}</p>
                  </div>
                </div>
                <StatusBadge status={zone.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MoistureRing value={zone.moisture} size={72} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-display text-lg font-medium" style={{ color: "hsl(30,25%,15%)" }}>{zone.moisture}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "hsl(30,15%,45%)" }}>Влажность</p>
                    <p className="text-xs mt-1" style={{ color: "hsl(30,15%,55%)" }}>Полит {zone.lastWatered}</p>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "hsl(var(--primary))" }}>
                  <Icon name="Droplets" size={16} style={{ color: "hsl(42,30%,96%)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Schedule ────────────────────────────────────────────────────────────────
function Schedule() {
  const [items, setItems] = useState(schedule);

  const toggleDay = (idx: number, day: string) => {
    setItems(prev => prev.map((it, i) => i !== idx ? it : {
      ...it,
      days: it.days.includes(day) ? it.days.filter(d => d !== day) : [...it.days, day]
    }));
  };

  const toggleEnabled = (idx: number) => {
    setItems(prev => prev.map((it, i) => i !== idx ? it : { ...it, enabled: !it.enabled }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-light" style={{ color: "hsl(30,25%,15%)" }}>Расписание полива</h3>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: "hsl(var(--primary))", color: "hsl(42,30%,96%)" }}>
          <Icon name="Plus" size={16} />
          Добавить
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className={`rounded-2xl p-5 transition-all ${item.enabled ? "forest-card" : "opacity-60"}`}
            style={!item.enabled ? { background: "hsl(42,20%,92%)", border: "1px solid hsl(42,20%,85%)" } : {}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>{item.zone}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(30,15%,50%)" }}>
                    <Icon name="Clock" size={12} className="inline mr-1" />{item.time} · {item.duration} мин
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleEnabled(idx)}
                className="w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
                style={{ background: item.enabled ? "hsl(var(--primary))" : "hsl(42,20%,78%)" }}
              >
                <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: item.enabled ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(idx, day)}
                  className={`schedule-chip ${item.days.includes(day) ? "active" : "inactive"}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Smart weather block */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, hsla(85,28%,42%,0.12) 0%, hsla(142,35%,28%,0.08) 100%)", border: "1px solid hsla(142,35%,28%,0.15)" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">🌦</span>
          <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>Умные сценарии по погоде</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Пропустить полив при дожде > 5 мм", enabled: true },
            { label: "Уменьшить объём при влажности > 80%", enabled: true },
            { label: "Увеличить частоту в жару > 30°C", enabled: false },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between">
              <p className="text-sm font-body" style={{ color: "hsl(30,20%,35%)" }}>{rule.label}</p>
              <div className="w-10 h-5 rounded-full relative cursor-pointer transition-all"
                style={{ background: rule.enabled ? "hsl(var(--primary))" : "hsl(42,20%,78%)" }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                  style={{ left: rule.enabled ? "calc(100% - 18px)" : "2px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Statistics ──────────────────────────────────────────────────────────────
function Statistics() {
  const maxLiters = Math.max(...weekStats.map(d => d.liters));

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="font-display text-2xl font-light" style={{ color: "hsl(30,25%,15%)" }}>Статистика полива</h3>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "За неделю", value: "595", unit: "л", icon: "BarChart2", color: "hsla(200,55%,48%,0.15)", textColor: "hsl(200,55%,35%)" },
          { label: "Сегодня", value: "100", unit: "л", icon: "Droplets", color: "hsla(142,35%,28%,0.12)", textColor: "hsl(142,35%,28%)" },
          { label: "Сеансов полива", value: "14", unit: "шт", icon: "Activity", color: "hsla(85,28%,42%,0.15)", textColor: "hsl(85,28%,38%)" },
          { label: "Экономия умных сценариев", value: "240", unit: "л", icon: "Brain", color: "hsla(22,40%,55%,0.15)", textColor: "hsl(22,40%,40%)" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: s.color, border: `1px solid ${s.color.replace("0.15", "0.3").replace("0.12", "0.25")}` }}>
            <Icon name={s.icon} size={20} style={{ color: s.textColor }} />
            <p className="font-display text-3xl font-light mt-2" style={{ color: "hsl(30,25%,15%)" }}>
              {s.value}<span className="text-base ml-1">{s.unit}</span>
            </p>
            <p className="text-xs font-body mt-1" style={{ color: "hsl(30,15%,50%)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl p-5 forest-card">
        <p className="font-body font-semibold text-sm mb-4" style={{ color: "hsl(30,25%,15%)" }}>Расход воды за неделю</p>
        <div className="flex items-end gap-2 h-32">
          {weekStats.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-xs font-body" style={{ color: "hsl(30,15%,50%)" }}>{d.liters}</p>
              <div
                className="w-full rounded-t-lg transition-all duration-700"
                style={{
                  height: `${(d.liters / maxLiters) * 100}%`,
                  background: "linear-gradient(to top, hsl(142,35%,28%), hsl(168,40%,45%))",
                }}
              />
              <p className="text-xs font-body" style={{ color: "hsl(30,15%,45%)" }}>{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="rounded-2xl p-5" style={{ background: "hsl(42,25%,98%)", border: "1px solid hsl(42,20%,88%)" }}>
        <p className="font-body font-semibold text-sm mb-4" style={{ color: "hsl(30,25%,15%)" }}>Журнал событий</p>
        <div className="space-y-3">
          {logs.map((log, i) => (
            <div key={log.id} className="flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: log.type === "auto" ? "hsla(142,35%,28%,0.12)" : log.type === "smart" ? "hsla(200,55%,48%,0.12)" : "hsla(22,40%,55%,0.15)" }}>
                <Icon
                  name={log.type === "auto" ? "Clock" : log.type === "smart" ? "Brain" : "Hand"}
                  size={14}
                  style={{ color: log.type === "auto" ? "hsl(142,35%,35%)" : log.type === "smart" ? "hsl(200,55%,40%)" : "hsl(22,40%,45%)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body truncate" style={{ color: "hsl(30,25%,20%)" }}>{log.zone}</p>
                <p className="text-xs" style={{ color: "hsl(30,15%,55%)" }}>{log.date} · {log.time} · {log.duration} · {log.volume}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: log.type === "auto" ? "hsla(142,35%,28%,0.12)" : "hsla(200,55%,48%,0.12)", color: log.type === "auto" ? "hsl(142,35%,30%)" : "hsl(200,55%,38%)" }}>
                {log.type === "auto" ? "авто" : log.type === "smart" ? "умный" : "ручной"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="font-display text-2xl font-light" style={{ color: "hsl(30,25%,15%)" }}>Настройки системы</h3>

      <div className="rounded-2xl p-5 forest-card">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Radio" size={18} style={{ color: "hsl(142,35%,35%)" }} />
          <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>Датчики влажности</p>
        </div>
        <div className="space-y-4">
          {zones.map(zone => (
            <div key={zone.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>{zone.icon}</span>
                <div>
                  <p className="text-sm font-body" style={{ color: "hsl(30,20%,20%)" }}>{zone.name}</p>
                  <p className="text-xs" style={{ color: "hsl(30,15%,55%)" }}>Датчик #{zone.id} · Онлайн</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-sm font-body font-medium" style={{ color: "hsl(142,35%,30%)" }}>{zone.moisture}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "hsl(42,25%,98%)", border: "1px solid hsl(42,20%,88%)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Bell" size={18} style={{ color: "hsl(22,40%,45%)" }} />
          <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>Уведомления</p>
        </div>
        <div className="space-y-4">
          {[
            { label: "Полив начат / завершён", enabled: true },
            { label: "Низкая влажность почвы", enabled: true },
            { label: "Изменение по погоде", enabled: true },
            { label: "Напоминание об обслуживании", enabled: false },
            { label: "Ошибки системы", enabled: true },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between">
              <p className="text-sm font-body" style={{ color: "hsl(30,20%,30%)" }}>{n.label}</p>
              <div className="w-10 h-5 rounded-full relative cursor-pointer"
                style={{ background: n.enabled ? "hsl(var(--primary))" : "hsl(42,20%,78%)" }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                  style={{ left: n.enabled ? "calc(100% - 18px)" : "2px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5 warm-card">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Settings" size={18} style={{ color: "hsl(22,40%,45%)" }} />
          <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>Параметры системы</p>
        </div>
        <div className="space-y-4">
          {[
            { label: "Порог критической влажности", value: "35%", icon: "Droplets" },
            { label: "Давление воды", value: "2.4 бар", icon: "Gauge" },
            { label: "Источник погоды", value: "OpenWeather", icon: "CloudSun" },
            { label: "Зона растений", value: "Средняя полоса", icon: "MapPin" },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={p.icon} size={16} style={{ color: "hsl(22,40%,50%)" }} />
                <p className="text-sm font-body" style={{ color: "hsl(30,20%,30%)" }}>{p.label}</p>
              </div>
              <p className="text-sm font-medium font-body" style={{ color: "hsl(30,25%,20%)" }}>{p.value}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 rounded-2xl font-body font-medium text-sm transition-all hover:opacity-90"
        style={{ background: "hsl(var(--primary))", color: "hsl(42,30%,96%)" }}>
        Сохранить настройки
      </button>
    </div>
  );
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
function Alerts() {
  const typeStyles: Record<string, { bg: string; border: string; iconColor: string }> = {
    warning: { bg: "hsla(22,40%,55%,0.12)", border: "hsla(22,40%,55%,0.3)", iconColor: "hsl(22,50%,45%)" },
    info: { bg: "hsla(200,55%,48%,0.1)", border: "hsla(200,55%,48%,0.25)", iconColor: "hsl(200,55%,40%)" },
    maintenance: { bg: "hsla(38,35%,75%,0.25)", border: "hsla(38,35%,75%,0.5)", iconColor: "hsl(38,35%,40%)" },
    success: { bg: "hsla(142,35%,28%,0.1)", border: "hsla(142,35%,28%,0.2)", iconColor: "hsl(142,35%,30%)" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-light" style={{ color: "hsl(30,25%,15%)" }}>Уведомления и напоминания</h3>
        <span className="text-xs px-3 py-1 rounded-full font-body font-medium"
          style={{ background: "hsla(10,70%,50%,0.12)", color: "hsl(10,70%,40%)" }}>
          2 активных
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, i) => {
          const s = typeStyles[alert.type];
          return (
            <div key={alert.id} className="rounded-2xl p-5 animate-fade-up"
              style={{ background: s.bg, border: `1px solid ${s.border}`, animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: s.bg }}>
                  <Icon name={alert.icon} size={20} style={{ color: s.iconColor }} />
                </div>
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>{alert.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "hsl(30,15%,45%)" }}>{alert.desc}</p>
                  <p className="text-xs mt-2" style={{ color: "hsl(30,15%,58%)" }}>{alert.time}</p>
                </div>
                <button className="flex-shrink-0">
                  <Icon name="X" size={16} style={{ color: "hsl(30,15%,60%)" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-5 warm-card">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Calendar" size={18} style={{ color: "hsl(22,40%,45%)" }} />
          <p className="font-body font-semibold text-sm" style={{ color: "hsl(30,25%,15%)" }}>Техническое обслуживание</p>
        </div>
        <div className="space-y-3">
          {[
            { task: "Очистка фильтров", due: "21 апреля", status: "soon" },
            { task: "Проверка датчиков", due: "1 мая", status: "ok" },
            { task: "Замена прокладок", due: "15 мая", status: "ok" },
            { task: "Сезонная калибровка", due: "1 июня", status: "ok" },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${t.status === "soon" ? "bg-orange-400" : "bg-green-400"}`} />
                <p className="text-sm font-body" style={{ color: "hsl(30,20%,25%)" }}>{t.task}</p>
              </div>
              <p className="text-xs font-body" style={{ color: t.status === "soon" ? "hsl(22,50%,45%)" : "hsl(30,15%,55%)" }}>{t.due}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
const navItems: { id: Tab; label: string; icon: string; emoji: string }[] = [
  { id: "dashboard", label: "Главная", icon: "Home", emoji: "🌱" },
  { id: "schedule", label: "Расписание", icon: "CalendarDays", emoji: "📅" },
  { id: "stats", label: "Статистика", icon: "BarChart2", emoji: "📊" },
  { id: "settings", label: "Настройки", icon: "Settings", emoji: "⚙️" },
  { id: "alerts", label: "Уведомления", icon: "Bell", emoji: "🔔" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "schedule": return <Schedule />;
      case "stats": return <Statistics />;
      case "settings": return <Settings />;
      case "alerts": return <Alerts />;
    }
  };

  return (
    <div className="min-h-screen nature-bg flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col min-h-screen"
        style={{ background: "linear-gradient(180deg, hsl(142,30%,18%) 0%, hsl(142,25%,14%) 100%)" }}>

        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "hsla(85,28%,60%,0.25)" }}>
              <span className="text-xl">💧</span>
            </div>
            <div>
              <p className="font-display text-xl font-light" style={{ color: "hsl(85,20%,90%)" }}>АкваФлора</p>
              <p className="text-xs font-body" style={{ color: "hsl(85,15%,55%)" }}>Умный полив</p>
            </div>
          </div>
        </div>

        <div className="mx-4 rounded-2xl overflow-hidden mb-4" style={{ height: 100 }}>
          <img src={ILLUSTRATION} alt="" className="w-full h-full object-cover object-top opacity-60" />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item w-full text-left ${activeTab === item.id ? "active" : ""}`}
              style={{ color: activeTab === item.id ? "hsl(42,30%,96%)" : "hsl(85,15%,65%)" }}
            >
              <span className="text-base">{item.emoji}</span>
              <span>{item.label}</span>
              {item.id === "alerts" && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-body"
                  style={{ background: "hsla(10,70%,50%,0.3)", color: "hsl(10,70%,80%)" }}>2</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 m-3 rounded-2xl"
          style={{ background: "hsla(85,28%,42%,0.2)", border: "1px solid hsla(85,28%,42%,0.3)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs font-body font-medium" style={{ color: "hsl(85,20%,80%)" }}>Система активна</p>
          </div>
          <p className="text-xs font-body" style={{ color: "hsl(85,15%,55%)" }}>4 зоны · 2 активны</p>
          <p className="text-xs font-body mt-1" style={{ color: "hsl(85,15%,55%)" }}>Следующий полив: 18:00</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}