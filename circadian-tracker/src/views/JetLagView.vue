<template>
  <div class="jetlag-view">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Promotion /></el-icon>
        跨时区时差自适应方案
      </h2>
      <el-tag v-if="result" type="info" effect="plain" round>
        {{ result.directionLabel }} · 时差 {{ result.absTzDiff }} 小时
      </el-tag>
    </div>

    <div class="input-section ct-card" v-if="!result">
      <div class="ct-title">
        <el-icon><EditPen /></el-icon>
        输入行程信息
      </div>
      <el-form :model="form" label-width="100px" label-position="top" class="jetlag-form">
        <div class="form-row">
          <el-form-item label="出发城市">
            <el-autocomplete
              v-model="form.departureCity"
              :fetch-suggestions="queryDepartureCities"
              placeholder="输入城市名称"
              clearable
              style="width: 100%"
              @select="handleDepartureSelect"
            >
              <template #prefix><el-icon><Location /></el-icon></template>
            </el-autocomplete>
          </el-form-item>
          <div class="arrow-separator">
            <el-icon :size="24"><Right /></el-icon>
          </div>
          <el-form-item label="目的地城市">
            <el-autocomplete
              v-model="form.destinationCity"
              :fetch-suggestions="queryDestinationCities"
              placeholder="输入城市名称"
              clearable
              style="width: 100%"
              @select="handleDestinationSelect"
            >
              <template #prefix><el-icon><Flag /></el-icon></template>
            </el-autocomplete>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="出发日期">
            <el-date-picker
              v-model="form.departureDate"
              type="date"
              placeholder="选择出发日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="到达日期">
            <el-date-picker
              v-model="form.arrivalDate"
              type="date"
              placeholder="选择到达日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="当前入睡时间">
            <el-time-picker
              v-model="form.bedtime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择入睡时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="当前起床时间">
            <el-time-picker
              v-model="form.wakeTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择起床时间"
              style="width: 100%"
            />
          </el-form-item>
        </div>
        <div class="form-actions">
          <el-button type="primary" @click="handleGenerate" :loading="generating" :icon="CaretRight" round size="large">
            生成调整方案
          </el-button>
        </div>
      </el-form>
    </div>

    <div class="result-section" v-if="result">
      <div class="summary-card ct-card">
        <div class="summary-icon" :class="result.direction">
          <el-icon :size="28"><Promotion /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-title">{{ result.directionLabel }}</div>
          <div class="summary-text">{{ result.summary }}</div>
        </div>
        <div class="summary-badges">
          <div class="badge-item">
            <span class="badge-value">{{ result.absTzDiff }}h</span>
            <span class="badge-label">时差</span>
          </div>
          <div class="badge-item">
            <span class="badge-value">{{ result.totalDays }}天</span>
            <span class="badge-label">调整周期</span>
          </div>
          <div class="badge-item" v-if="result.preAdjustDays > 0">
            <span class="badge-value">{{ result.preAdjustDays }}天</span>
            <span class="badge-label">预调整</span>
          </div>
        </div>
      </div>

      <div class="timeline-section">
        <div class="ct-title">
          <el-icon><Calendar /></el-icon>
          逐日调整计划
        </div>
        <div class="timeline">
          <div
            v-for="(day, idx) in result.days"
            :key="day.date"
            class="timeline-day"
            :class="{
              'pre-adjust': day.isPreAdjust,
              'arrival': day.isArrivalDay,
              'departure': day.isDepartureDay,
              'completed': day.phasePercent >= 100
            }"
          >
            <div class="day-marker">
              <div class="marker-dot" :style="{ background: getPhaseColor(day.phasePercent) }"></div>
              <div v-if="idx < result.days.length - 1" class="marker-line"></div>
            </div>
            <div class="day-card ct-card">
              <div class="day-header">
                <div class="day-date">
                  <span class="date-main">{{ day.date }}</span>
                  <span class="date-weekday">{{ day.weekday }}</span>
                </div>
                <div class="day-badges">
                  <el-tag v-if="day.isPreAdjust" size="small" type="info" effect="plain" round>预调整</el-tag>
                  <el-tag v-if="day.isDepartureDay" size="small" type="warning" effect="plain" round>出发</el-tag>
                  <el-tag v-if="day.isArrivalDay" size="small" type="success" effect="plain" round>抵达</el-tag>
                  <el-tag size="small" :type="getPhaseTagType(day.phasePercent)" effect="dark" round>
                    {{ day.phaseLabel }} {{ day.phasePercent }}%
                  </el-tag>
                </div>
              </div>

              <el-progress
                :percentage="day.phasePercent"
                :color="getPhaseColor(day.phasePercent)"
                :stroke-width="6"
                :show-text="false"
                style="margin: 12px 0"
              />

              <div class="day-schedule">
                <div class="schedule-row">
                  <div class="schedule-item bedtime">
                    <el-icon><Moon /></el-icon>
                    <div class="schedule-detail">
                      <span class="schedule-label">入睡</span>
                      <span class="schedule-time">{{ day.adjustedBedtime }}</span>
                      <span class="schedule-offset" :class="day.bedtimeOffset > 0 ? 'delay' : 'advance'">
                        {{ day.bedtimeOffset > 0 ? '+' : '' }}{{ day.bedtimeOffset }}h
                      </span>
                    </div>
                  </div>
                  <div class="schedule-item wake">
                    <el-icon><Sunny /></el-icon>
                    <div class="schedule-detail">
                      <span class="schedule-label">起床</span>
                      <span class="schedule-time">{{ day.adjustedWakeTime }}</span>
                    </div>
                  </div>
                  <div class="schedule-item dest-time">
                    <el-icon><Timer /></el-icon>
                    <div class="schedule-detail">
                      <span class="schedule-label">目的地当地时间</span>
                      <span class="schedule-time">{{ day.destLocalBedtime }} → {{ day.destLocalWakeTime }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="guidance-grid">
                <div class="guidance-card light-seek">
                  <div class="guidance-icon">☀️</div>
                  <div class="guidance-content">
                    <div class="guidance-title">光照时段</div>
                    <div class="guidance-time">{{ day.lightSeek.start }} - {{ day.lightSeek.end }}</div>
                    <div class="guidance-desc">{{ day.lightSeek.description }}</div>
                  </div>
                </div>
                <div class="guidance-card light-avoid">
                  <div class="guidance-icon">🕶️</div>
                  <div class="guidance-content">
                    <div class="guidance-title">避光时段</div>
                    <div class="guidance-time">{{ day.lightAvoid.start }} - {{ day.lightAvoid.end }}</div>
                    <div class="guidance-desc">{{ day.lightAvoid.description }}</div>
                  </div>
                </div>
                <div class="guidance-card caffeine">
                  <div class="guidance-icon">☕</div>
                  <div class="guidance-content">
                    <div class="guidance-title">咖啡因窗口</div>
                    <div class="guidance-time">{{ day.caffeineWindow.start }} - {{ day.caffeineWindow.end }}</div>
                    <div class="guidance-desc">{{ day.caffeineWindow.description }}</div>
                  </div>
                </div>
                <div class="guidance-card caffeine-cut">
                  <div class="guidance-icon">🚫</div>
                  <div class="guidance-content">
                    <div class="guidance-title">咖啡因截止</div>
                    <div class="guidance-time">{{ day.caffeineCutOff }}</div>
                    <div class="guidance-desc">{{ day.caffeineDescription }}</div>
                  </div>
                </div>
              </div>

              <el-collapse class="tips-collapse">
                <el-collapse-item>
                  <template #title>
                    <span class="tips-title">💡 当日建议 ({{ day.tips.length }}条)</span>
                  </template>
                  <div class="tips-list">
                    <div v-for="(tip, ti) in day.tips" :key="ti" class="tip-item">
                      <el-icon size="12"><InfoFilled /></el-icon>
                      <span>{{ tip }}</span>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </div>

      <div class="result-actions">
        <el-button type="primary" @click="handleExportICS" :icon="Download" round>
          导出日历事件 (.ics)
        </el-button>
        <el-button @click="handleReset" :icon="RefreshLeft" round>
          重新生成
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { CaretRight, Download, RefreshLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { searchCities, calculateJetLag, downloadICS } from '@/utils/jetlag'

const form = reactive({
  departureCity: '',
  destinationCity: '',
  departureDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
  arrivalDate: dayjs().add(4, 'day').format('YYYY-MM-DD'),
  bedtime: '23:00',
  wakeTime: '07:00'
})

const result = ref(null)
const generating = ref(false)

function queryDepartureCities(queryString, cb) {
  const cities = searchCities(queryString)
  cb(cities.map(c => ({ value: c })))
}

function queryDestinationCities(queryString, cb) {
  const cities = searchCities(queryString)
  cb(cities.map(c => ({ value: c })))
}

function handleDepartureSelect(item) {
  form.departureCity = item.value
}

function handleDestinationSelect(item) {
  form.destinationCity = item.value
}

function handleGenerate() {
  if (!form.departureCity) {
    ElMessage.warning('请输入出发城市')
    return
  }
  if (!form.destinationCity) {
    ElMessage.warning('请输入目的地城市')
    return
  }
  if (!form.departureDate) {
    ElMessage.warning('请选择出发日期')
    return
  }
  if (!form.arrivalDate) {
    ElMessage.warning('请选择到达日期')
    return
  }
  if (!form.bedtime) {
    ElMessage.warning('请设置当前入睡时间')
    return
  }
  if (!form.wakeTime) {
    ElMessage.warning('请设置当前起床时间')
    return
  }

  generating.value = true

  setTimeout(() => {
    const r = calculateJetLag({
      departureCity: form.departureCity,
      destinationCity: form.destinationCity,
      departureDate: form.departureDate,
      arrivalDate: form.arrivalDate,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime
    })

    if (r.error) {
      ElMessage.error(r.error)
      generating.value = false
      return
    }

    result.value = r
    generating.value = false
    ElMessage.success('时差调整方案已生成')
  }, 300)
}

function handleReset() {
  result.value = null
}

function handleExportICS() {
  if (!result.value) return
  downloadICS(result.value)
  ElMessage.success('日历事件已导出')
}

function getPhaseColor(percent) {
  if (percent >= 100) return '#67c28a'
  if (percent >= 70) return '#5a9ab8'
  if (percent >= 40) return '#e6a23c'
  return '#f56c6c'
}

function getPhaseTagType(percent) {
  if (percent >= 100) return 'success'
  if (percent >= 70) return ''
  if (percent >= 40) return 'warning'
  return 'danger'
}
</script>

<style lang="scss" scoped>
.jetlag-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ct-text);

    .el-icon { color: var(--ct-primary); }
  }
}

.jetlag-form {
  .form-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    align-items: start;

    &:nth-child(2),
    &:nth-child(3) {
      grid-template-columns: 1fr 1fr;
    }

    .arrow-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 36px;
      color: var(--ct-primary);
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    padding-top: 8px;
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;

  .summary-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;

    &.east {
      background: linear-gradient(135deg, #e6a23c, #d48806);
    }
    &.west {
      background: linear-gradient(135deg, #7eb8d8, #5a9ab8);
    }
  }

  .summary-content {
    flex: 1;
    min-width: 0;

    .summary-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--ct-text);
      margin-bottom: 6px;
    }
    .summary-text {
      font-size: 13px;
      line-height: 1.6;
      color: var(--ct-text-secondary);
    }
  }

  .summary-badges {
    display: flex;
    gap: 16px;
    flex-shrink: 0;

    .badge-item {
      text-align: center;

      .badge-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: var(--ct-primary);
      }
      .badge-label {
        display: block;
        font-size: 11px;
        color: var(--ct-text-secondary);
        margin-top: 2px;
      }
    }
  }
}

.timeline-section {
  .timeline {
    display: flex;
    flex-direction: column;
  }

  .timeline-day {
    display: flex;
    gap: 16px;

    &.pre-adjust .day-card {
      border-left: 3px solid #909399;
    }
    &.arrival .day-card {
      border-left: 3px solid #67c28a;
    }
    &.departure .day-card {
      border-left: 3px solid #e6a23c;
    }
    &.completed .day-card {
      border-left: 3px solid #67c28a;
      opacity: 0.85;
    }

    .day-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 20px;
      flex-shrink: 0;
      width: 20px;

      .marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 0 3px var(--ct-surface), 0 0 0 5px currentColor;
        opacity: 0.8;
      }

      .marker-line {
        width: 2px;
        flex: 1;
        background: var(--ct-border);
        margin-top: 4px;
        min-height: 40px;
      }
    }

    .day-card {
      flex: 1;
      margin-bottom: 12px;
      padding: 18px;

      .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .day-date {
          .date-main {
            font-size: 15px;
            font-weight: 700;
            color: var(--ct-text);
          }
          .date-weekday {
            font-size: 12px;
            color: var(--ct-text-secondary);
            margin-left: 8px;
          }
        }

        .day-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
      }

      .day-schedule {
        margin: 12px 0;

        .schedule-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .schedule-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 10px;
          background: var(--ct-bg);

          .el-icon {
            font-size: 20px;
          }

          &.bedtime .el-icon { color: #7eb8d8; }
          &.wake .el-icon { color: #e6a23c; }
          &.dest-time .el-icon { color: #909399; }

          .schedule-detail {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .schedule-label {
              font-size: 11px;
              color: var(--ct-text-secondary);
            }
            .schedule-time {
              font-size: 15px;
              font-weight: 700;
              color: var(--ct-text);
            }
            .schedule-offset {
              font-size: 11px;
              font-weight: 600;
              &.advance { color: #5a9ab8; }
              &.delay { color: #e6a23c; }
            }
          }
        }
      }

      .guidance-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 12px 0;

        .guidance-card {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 10px;
          align-items: flex-start;

          .guidance-icon {
            font-size: 20px;
            flex-shrink: 0;
            line-height: 1;
          }

          .guidance-content {
            min-width: 0;

            .guidance-title {
              font-size: 12px;
              font-weight: 600;
              color: var(--ct-text);
              margin-bottom: 2px;
            }
            .guidance-time {
              font-size: 14px;
              font-weight: 700;
              color: var(--ct-primary);
              margin-bottom: 2px;
            }
            .guidance-desc {
              font-size: 11px;
              line-height: 1.4;
              color: var(--ct-text-secondary);
            }
          }

          &.light-seek {
            background: rgba(230, 162, 60, 0.08);
            border: 1px solid rgba(230, 162, 60, 0.2);
          }
          &.light-avoid {
            background: rgba(100, 100, 120, 0.08);
            border: 1px solid rgba(100, 100, 120, 0.2);
          }
          &.caffeine {
            background: rgba(184, 130, 101, 0.08);
            border: 1px solid rgba(184, 130, 101, 0.2);
          }
          &.caffeine-cut {
            background: rgba(245, 108, 108, 0.08);
            border: 1px solid rgba(245, 108, 108, 0.2);
          }
        }
      }

      .tips-collapse {
        border: none;
        margin-top: 8px;

        :deep(.el-collapse-item__header) {
          background: transparent;
          border: none;
          height: 32px;
          line-height: 32px;
          padding: 0;

          .tips-title {
            font-size: 12px;
            color: var(--ct-text-secondary);
          }
        }

        :deep(.el-collapse-item__wrap) {
          border: none;
          background: transparent;
        }

        :deep(.el-collapse-item__content) {
          padding: 0 0 4px;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .tip-item {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            font-size: 12px;
            line-height: 1.5;
            color: var(--ct-text-secondary);

            .el-icon {
              margin-top: 3px;
              flex-shrink: 0;
              color: var(--ct-primary);
            }
          }
        }
      }
    }
  }
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
}
</style>
