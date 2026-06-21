export const DISCLAIMER = '非临床诊断，仅供参考。如有睡眠问题请及时咨询专业医生。'

export const icsd3Categories = [
  {
    id: 'insomnia',
    name: '失眠障碍',
    code: '780.52',
    description: '尽管有充足的睡眠机会和适宜的睡眠环境，仍持续存在睡眠起始、睡眠维持或睡眠质量问题，并导致日间功能损害。',
    diagnosticCriteria: [
      '主诉入睡困难、维持睡眠困难或早醒',
      '每周至少3个晚上出现上述症状',
      '持续至少3个月',
      '导致日间疲劳、注意力不集中、情绪波动等功能损害',
      '排除其他睡眠障碍、精神障碍或物质使用所致'
    ],
    references: [
      { title: 'ICSD-3 国际睡眠障碍分类第3版', url: 'https://www.sleepeducation.org/essentials-in-sleep/sleep-disorders' },
      { title: '中国失眠症诊断和治疗指南(2017)', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6138276/' }
    ],
    severity: 'high'
  },
  {
    id: 'obstructive_sleep_apnea',
    name: '阻塞性睡眠呼吸暂停',
    code: 'G47.33',
    description: '睡眠期间上气道反复塌陷阻塞，导致呼吸暂停或低通气，引起血氧饱和度下降和睡眠碎片化。',
    diagnosticCriteria: [
      '夜间打鼾、呼吸暂停、憋醒',
      '日间过度嗜睡（Epworth评分≥10）',
      'AHI（呼吸暂停低通气指数）≥5次/小时',
      '伴夜间血氧饱和度下降≥3%'
    ],
    references: [
      { title: 'AASM 阻塞性睡眠呼吸暂停诊疗指南', url: 'https://aasm.org/clinical-resources/clinical-guidelines/obstructive-sleep-apnea-in-adults/' },
      { title: '中国阻塞性睡眠呼吸暂停低通气综合征诊治指南', url: 'https://rs.yiigle.com/CN112147201218/406628.htm' }
    ],
    severity: 'high'
  },
  {
    id: 'restless_legs',
    name: '不宁腿综合征',
    code: 'G25.81',
    description: '静息时下肢出现难以忍受的不适感，迫使患者活动下肢以缓解症状，常导致入睡困难。',
    diagnosticCriteria: [
      '活动双腿的强烈欲望，通常伴腿部不适感',
      '休息或静止时症状出现或加重',
      '活动后症状部分或完全缓解',
      '傍晚或夜间症状加重'
    ],
    references: [
      { title: 'MDS 不宁腿综合征诊断标准', url: 'https://www.movementdisorders.org' }
    ],
    severity: 'medium'
  },
  {
    id: 'narcolepsy',
    name: '发作性睡病',
    code: 'G47.4',
    description: '中枢神经系统病变导致的过度睡眠障碍，特征为白天不可抗拒的睡眠发作。',
    diagnosticCriteria: [
      '白天过度嗜睡持续至少3个月',
      '猝倒发作（情绪诱发的突然肌张力丧失）',
      'MSLT（多次睡眠潜伏期试验）平均睡眠潜伏期≤8分钟',
      '脑脊液下丘脑分泌素-1水平降低'
    ],
    references: [
      { title: 'ICSD-3 发作性睡病诊断标准', url: 'https://www.sleepeducation.org/essentials-in-sleep/sleep-disorders/narcolepsy' }
    ],
    severity: 'high'
  },
  {
    id: 'delayed_sleep_phase',
    name: '睡眠时相延迟障碍（晚睡型）',
    code: 'G47.21',
    description: '主要睡眠时段相对于期望或社会可接受的作息时间延迟，导致入睡困难和早晨难以唤醒。',
    diagnosticCriteria: [
      'MSFsc（校正后的睡眠中点时间）≥05:00',
      '入睡时间通常在凌晨2点以后',
      '周末睡眠时长比工作日长≥1小时',
      '在不强制早起的情况下睡眠质量正常',
      '症状持续至少3个月'
    ],
    references: [
      { title: 'ICSD-3 昼夜节律睡眠-觉醒障碍', url: 'https://www.sleepeducation.org/essentials-in-sleep/sleep-disorders/circadian-rhythm-sleep-wake-disorders' }
    ],
    severity: 'medium'
  },
  {
    id: 'advanced_sleep_phase',
    name: '睡眠时相提前障碍（早睡型）',
    code: 'G47.22',
    description: '主要睡眠时段相对于期望的作息时间提前，表现为傍晚困倦、夜间早醒。',
    diagnosticCriteria: [
      'MSFsc ≤ 01:00',
      '入睡时间通常在晚上8点前',
      '凌晨2-4点早醒，无法再入睡',
      '症状持续至少3个月'
    ],
    references: [
      { title: 'ICSD-3 昼夜节律睡眠-觉醒障碍', url: 'https://www.sleepeducation.org/essentials-in-sleep/sleep-disorders/circadian-rhythm-sleep-wake-disorders' }
    ],
    severity: 'medium'
  },
  {
    id: 'shift_work_disorder',
    name: '倒班工作睡眠障碍',
    code: 'G47.26',
    description: '由于工作时间表要求在正常睡眠时间工作，导致昼夜节律与环境时间不同步。',
    diagnosticCriteria: [
      '工作时间安排在常规睡眠时段',
      '与工作相关的过度嗜睡和/或失眠',
      '症状持续至少1个月',
      '睡眠日志显示睡眠时长减少≥1小时'
    ],
    references: [
      { title: 'AASM 倒班工作睡眠障碍临床实践指南', url: 'https://aasm.org/2021-clinical-practice-guideline-for-the-pharmacologic-treatment-for-shift-work-disorder/' }
    ],
    severity: 'medium'
  }
]

export const assessmentScales = {
  epworth: {
    id: 'epworth',
    name: 'Epworth 嗜睡量表 (ESS)',
    description: '评估日间嗜睡程度的自评量表，共8个项目，每题0-3分。',
    items: [
      { id: 1, question: '坐着阅读时' },
      { id: 2, question: '看电视时' },
      { id: 3, question: '在公共场所坐着不动时（如剧场或开会）' },
      { id: 4, question: '连续乘车1小时不休息' },
      { id: 5, question: '环境允许时下午躺下休息' },
      { id: 6, question: '坐着与人谈话时' },
      { id: 7, question: '午饭后安静坐着（未饮酒）' },
      { id: 8, question: '堵车时停车数分钟' }
    ],
    scoring: {
      0: '从不瞌睡',
      1: '轻微瞌睡',
      2: '中度瞌睡',
      3: '高度瞌睡'
    },
    interpretation: {
      '0-7': '日间嗜睡正常',
      '8-9': '轻微日间嗜睡',
      '10-15': '中度日间嗜睡（建议就医检查）',
      '16-24': '严重日间嗜睡（需立即就医）'
    },
    cutoff: 10,
    reference: { title: 'Johns MW. Sleep 1991;14(6):540-5', url: 'https://pubmed.ncbi.nlm.nih.gov/1790408/' }
  },
  isi: {
    id: 'isi',
    name: '失眠严重程度指数 (ISI)',
    description: '评估失眠严重程度的7项量表，每题0-4分。',
    items: [
      { id: 1, question: '对入睡困难的严重程度' },
      { id: 2, question: '对维持睡眠困难的严重程度' },
      { id: 3, question: '对早醒问题的严重程度' },
      { id: 4, question: '对当前睡眠模式的满意度' },
      { id: 5, question: '睡眠问题对日间功能的影响程度' },
      { id: 6, question: '他人觉察到的睡眠问题对您的影响' },
      { id: 7, question: '对睡眠问题的担忧程度' }
    ],
    interpretation: {
      '0-7': '无明显失眠',
      '8-14': '亚临床失眠',
      '15-21': '中度失眠',
      '22-28': '重度失眠'
    },
    cutoff: 8,
    reference: { title: 'Morin CM et al. Sleep 2011;34(5):601-8', url: 'https://pubmed.ncbi.nlm.nih.gov/21474193/' }
  },
  morningnessEveningness: {
    id: 'meq',
    name: '清晨型-夜晚型问卷 (MEQ)',
    description: '评估个体昼夜节律偏好的量表。',
    interpretation: {
      '16-30': '明确夜晚型',
      '31-41': '中度夜晚型',
      '42-58': '中间型',
      '59-69': '中度清晨型',
      '70-86': '明确清晨型'
    },
    reference: { title: 'Horne JA, Ostberg O. Int J Chronobiol 1976;4(2):97-110', url: 'https://pubmed.ncbi.nlm.nih.gov/986068/' }
  }
}

export const cbtInterventions = {
  sleepRestriction: {
    id: 'sleep_restriction',
    name: '睡眠限制疗法',
    category: 'CBT-I',
    description: '通过限制卧床时间以提高睡眠效率，是 CBT-I 的核心技术之一。',
    purpose: '提高睡眠效率，减少卧床清醒时间，巩固睡眠稳态。',
    steps: [
      { step: 1, description: '根据睡眠日志计算平均睡眠时长（TST）', duration: '1-2周' },
      { step: 2, description: '设定卧床时间 = TST + 30分钟（最小5.5小时）', duration: '持续' },
      { step: 3, description: '固定起床时间，即使前一晚睡眠不足', duration: '持续' },
      { step: 4, description: '当睡眠效率连续5天≥85%时，增加卧床时间15-30分钟', duration: '每周评估' },
      { step: 5, description: '如睡眠效率<80%，减少卧床时间15-30分钟', duration: '每周评估' }
    ],
    precautions: [
      '初期可能出现日间嗜睡，避免危险操作',
      '避免日间小睡超过20分钟',
      '严重抑郁症患者需在医生指导下进行'
    ],
    scheduleTemplate: {
      weekday: {
        bedtime: '计算值',
        riseTime: '固定值',
        allowedNap: '0-20分钟'
      },
      weekend: {
        riseTime: '与工作日相差不超过1小时'
      }
    },
    references: [
      { title: 'Spielman AJ et al. Psychiatry Res 1987;20(1):25-30', url: 'https://pubmed.ncbi.nlm.nih.gov/3612883/' }
    ]
  },
  stimulusControl: {
    id: 'stimulus_control',
    name: '刺激控制疗法',
    category: 'CBT-I',
    description: '重建卧室/床与睡眠的条件反射，减少与睡眠无关的活动。',
    purpose: '使卧室成为引发睡眠的特异性环境刺激。',
    steps: [
      { step: 1, description: '只有感到困倦时才上床', duration: '持续' },
      { step: 2, description: '床上仅进行睡眠和性活动，不工作、不玩手机、不看电视', duration: '持续' },
      { step: 3, description: '上床后20分钟无法入睡，起床离开卧室，有睡意再返回', duration: '持续' },
      { step: 4, description: '如再次卧床20分钟仍无法入睡，重复步骤3', duration: '持续' },
      { step: 5, description: '无论前一晚睡眠如何，固定时间起床', duration: '持续' },
      { step: 6, description: '避免日间小睡', duration: '持续' }
    ],
    precautions: [
      '需要良好的依从性',
      '初期可能加重睡眠不足感'
    ],
    scheduleTemplate: {
      bedroomRules: [
        '无电子设备',
        '温度18-22°C',
        '遮光良好',
        '保持安静'
      ],
      preSleepRoutine: [
        '睡前1小时开始放松活动',
        '避免强光刺激',
        '可进行温水浴或冥想'
      ]
    },
    references: [
      { title: 'Bootzin RR. Behav Ther 1972;3(4):460-7', url: 'https://pubmed.ncbi.nlm.nih.gov/4672624/' }
    ]
  },
  cognitiveRestructuring: {
    id: 'cognitive_restructuring',
    name: '认知重构',
    category: 'CBT-I',
    description: '识别并纠正与睡眠相关的功能不良认知和信念，减少睡前焦虑。',
    purpose: '降低对睡眠的焦虑和担忧，打破"焦虑→失眠→更焦虑"的恶性循环。',
    commonCognitiveDistortions: [
      { distortion: '灾难化思维', example: '"今晚睡不好，明天一定会崩溃"' },
      { distortion: '全有或全无思维', example: '"必须睡够8小时，否则就是失眠"' },
      { distortion: '放大担忧', example: '"失眠会导致严重的健康问题"' },
      { distortion: '控制错觉', example: '"我必须强迫自己睡着"' }
    ],
    techniques: [
      { technique: '认知挑战', description: '质疑消极想法的证据和合理性' },
      { technique: '去中心化', description: '客观看待失眠的实际影响' },
      { technique: '重新归因', description: '将失眠归因于可改变的因素而非永久特质' },
      { technique: '悖论意向', description: '主动尝试保持清醒以减轻焦虑' }
    ],
    dailyPractice: [
      { time: '早晨', activity: '记录夜间睡眠想法', duration: '10分钟' },
      { time: '下午', activity: '进行认知练习', duration: '15分钟' },
      { time: '睡前1小时', activity: '写下担忧并制定解决方案', duration: '15分钟' }
    ],
    references: [
      { title: 'Morin CM. Insomnia: Psychological assessment and management. Guilford Press; 1993.', url: 'https://www.guilford.com/books/Insomnia/Charles-M-Morin/9781462519704' }
    ]
  },
  sleepHygiene: {
    id: 'sleep_hygiene',
    name: '睡眠卫生教育',
    category: 'CBT-I',
    description: '建立有利于睡眠的生活习惯和环境因素。',
    components: [
      { category: '作息规律', items: [
        '每天同一时间起床，包括周末',
        '保持规律的就寝时间',
        '避免日间小睡超过20分钟',
        '小睡时间不晚于下午3点'
      ]},
      { category: '环境调节', items: [
        '卧室温度保持18-22°C',
        '保持卧室黑暗，使用遮光窗帘',
        '保持安静，必要时使用白噪音',
        '使用舒适的床垫和枕头'
      ]},
      { category: '饮食管理', items: [
        '睡前6小时内避免咖啡因',
        '睡前3小时内避免大量进食',
        '避免饮酒助眠',
        '睡前控制饮水量，减少夜间起夜'
      ]},
      { category: '运动锻炼', items: [
        '每天进行30分钟中等强度运动',
        '运动时间不晚于睡前3小时',
        '睡前可进行轻度拉伸'
      ]},
      { category: '睡前准备', items: [
        '睡前1小时减少蓝光暴露',
        '建立睡前放松仪式',
        '避免在床上使用电子设备',
        '睡前可进行温水浴（40-43°C，10-15分钟）'
      ]}
    ],
    references: [
      { title: 'AASM 睡眠卫生推荐', url: 'https://sleepeducation.org/healthy-sleep/healthy-sleep-tips/' }
    ]
  },
  lightTherapy: {
    id: 'light_therapy',
    name: '光疗',
    category: '非药物干预',
    description: '通过定时暴露于强光来调节昼夜节律，适用于睡眠时相障碍。',
    indications: [
      '睡眠时相延迟障碍（晚睡型）',
      '睡眠时相提前障碍（早睡型）',
      '季节性情感障碍',
      '倒班工作睡眠障碍',
      '时差反应'
    ],
    protocols: {
      delayed_phase: {
        timing: '清晨唤醒后立即进行',
        duration: '30-60分钟',
        intensity: '10000 lux',
        duration_weeks: '2-4周见效'
      },
      advanced_phase: {
        timing: '傍晚18:00-20:00进行',
        duration: '30-60分钟',
        intensity: '10000 lux',
        duration_weeks: '2-4周见效'
      }
    },
    precautions: [
      '眼部疾病患者需眼科检查后进行',
      '双相情感障碍患者慎用',
      '避免直视光源',
      '治疗期间监测情绪变化'
    ],
    references: [
      { title: 'AASM 光疗临床指南', url: 'https://aasm.org/2015-clinical-guideline-treatment-of-circadian-rhythm-sleep-wake-disorders/' }
    ]
  }
}

export const chronotypeCalculator = {
  calculateMSFsc: (bedtime, wakeTime, weekday) => {
    const [bedH, bedM] = bedtime.split(':').map(Number)
    const [wakeH, wakeM] = wakeTime.split(':').map(Number)
    
    let bedMinutes = bedH * 60 + bedM
    let wakeMinutes = wakeH * 60 + wakeM
    
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60
    }
    
    const midMinutes = (bedMinutes + wakeMinutes) / 2
    const midH = Math.floor(midMinutes / 60) % 24
    const midM = Math.round(midMinutes % 60)
    
    let correction = 0
    if (!weekday) {
      const tst = wakeMinutes - bedMinutes
      if (tst > 8 * 60) {
        correction = (tst - 8 * 60) / 2
      }
    }
    
    const correctedMidMinutes = midMinutes - correction
    const correctedH = Math.floor(correctedMidMinutes / 60) % 24
    const correctedM = Math.round(correctedMidMinutes % 60)
    
    return {
      rawMSF: `${midH.toString().padStart(2, '0')}:${midM.toString().padStart(2, '0')}`,
      correctedMSFsc: `${correctedH.toString().padStart(2, '0')}:${correctedM.toString().padStart(2, '0')}`,
      MSFscMinutes: correctedMidMinutes
    }
  },
  
  determineChronotype: (MSFscMinutes) => {
    if (MSFscMinutes >= 5 * 60 && MSFscMinutes < 24 * 60) {
      return {
        type: 'delayed',
        name: '晚睡型（夜晚型）',
        risk: '睡眠时相延迟障碍风险',
        description: '您的生物钟比普通人延迟，入睡困难但睡眠质量正常。建议尝试晨光疗法。'
      }
    } else if (MSFscMinutes >= 1 * 60 && MSFscMinutes < 2 * 60) {
      return {
        type: 'advanced',
        name: '早睡型（清晨型）',
        risk: '睡眠时相提前障碍风险',
        description: '您的生物钟比普通人提前，傍晚困倦、夜间早醒。建议尝试傍晚光疗。'
      }
    } else {
      return {
        type: 'normal',
        name: '中间型',
        risk: '节律正常',
        description: '您的昼夜节律处于正常范围内，继续保持规律作息。'
      }
    }
  }
}
