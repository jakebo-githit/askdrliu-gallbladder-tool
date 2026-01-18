document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('assessmentForm');
  const resultSection = document.getElementById('resultSection');
  const resultContent = document.getElementById('resultContent');
  const resetBtn = document.getElementById('resetBtn');
  const copyBtn = document.getElementById('copyBtn');
  const newAssessmentBtn = document.getElementById('newAssessmentBtn');

  let assessmentResult = null;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    performAssessment();
  });

  resetBtn.addEventListener('click', function() {
    form.reset();
    resultSection.style.display = 'none';
    assessmentResult = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  newAssessmentBtn.addEventListener('click', function() {
    form.reset();
    resultSection.style.display = 'none';
    assessmentResult = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  copyBtn.addEventListener('click', function() {
    if (assessmentResult) {
      const textToCopy = generatePlainTextResult(assessmentResult);

      navigator.clipboard.writeText(textToCopy).then(function() {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ 已复制';
        setTimeout(function() {
          copyBtn.textContent = originalText;
        }, 2000);
      }).catch(function(err) {
        alert('复制失败，请手动复制结果文本');
      });
    }
  });

  function performAssessment() {
    const data = {
      biliaryColic: document.getElementById('biliaryColic').value,
      fever: document.getElementById('fever').value,
      jaundice: document.getElementById('jaundice').value,
      pancreatitis: document.getElementById('pancreatitis').value,
      mainFinding: document.getElementById('mainFinding').value,
      stoneSize: document.getElementById('stoneSize').value,
      stoneNumber: document.getElementById('stoneNumber').value,
      wallThickness: document.getElementById('wallThickness').value,
      porcelain: document.getElementById('porcelain').value,
      neckImpaction: document.getElementById('neckImpaction').value,
      cbdStatus: document.getElementById('cbdStatus').value,
      labsObstruction: document.getElementById('labsObstruction').value,
      ejectionFraction: document.getElementById('ejectionFraction').value,
      liverDisease: document.getElementById('liverDisease').value,
      diabetes: document.getElementById('diabetes').value,
      hyperlipidemia: document.getElementById('hyperlipidemia').value,
      pregnancy: document.getElementById('pregnancy').value
    };

    assessmentResult = assessRisk(data);
    assessmentResult.incompleteItems = getIncompleteItems(data);
    displayResult(assessmentResult);

    form.style.display = 'none';
    resultSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getIncompleteItems(data) {
    const fieldLabels = {
      biliaryColic: '是否有反复右上腹疼痛/绞痛发作史',
      fever: '近期是否发热',
      jaundice: '近期是否出现黄疸',
      pancreatitis: '是否有胰腺炎病史',
      mainFinding: '超声主要发现',
      stoneSize: '结石大小',
      stoneNumber: '结石数量',
      wallThickness: '胆囊壁厚度',
      porcelain: '是否为瓷化胆囊',
      neckImpaction: '结石是否嵌顿在胆囊颈部',
      cbdStatus: '胆总管情况',
      labsObstruction: '实验室检查（肝功能/胆红素/转氨酶）',
      ejectionFraction: '胆囊收缩功能（排空分数）',
      liverDisease: '是否有慢性肝病史',
      diabetes: '是否有糖尿病',
      hyperlipidemia: '是否有高脂血症/代谢综合征',
      pregnancy: '是否怀孕'
    };

    const incompleteItems = [];

    for (const [field, value] of Object.entries(data)) {
      if (value === 'unknown' || value === 'not_done') {
        incompleteItems.push(fieldLabels[field]);
      }
    }

    return incompleteItems;
  }

  function assessRisk(data) {
    const result = {
      category: 'GREEN',
      isBorderline: false,
      redFlags: [],
      yellowFlags: [],
      modifiers: [],
      nextSteps: [],
      data: data
    };

    const painLevel = data.biliaryColic === 'occasional' || data.biliaryColic === 'recurrent';

    if (data.fever === 'yes') {
      result.category = 'RED';
      result.redFlags.push('存在发热或寒战症状');
    }

    if (data.jaundice === 'yes') {
      result.category = 'RED';
      result.redFlags.push('出现黄疸或尿色加深');
    }

    if (data.pancreatitis === 'yes') {
      result.category = 'RED';
      result.redFlags.push('既往有胆源性胰腺炎病史');
    }

    if (data.cbdStatus === 'yes' && data.labsObstruction === 'yes') {
      result.category = 'RED';
      result.redFlags.push('胆总管扩张/结石伴化验异常，提示梗阻');
    }

    if (data.porcelain === 'yes') {
      result.category = 'RED';
      result.redFlags.push('存在瓷性胆囊或胆囊壁钙化');
    }

    if (data.ejectionFraction === 'non-visualized') {
      result.category = 'RED';
      result.redFlags.push('胆囊不显影或萎缩');
    }

    if (data.neckImpaction === 'yes' && painLevel) {
      result.category = 'RED';
      result.redFlags.push('胆囊颈部嵌顿且伴反复疼痛');
    }

    if (data.wallThickness === '>5mm' && data.biliaryColic === 'recurrent' &&
        (data.ejectionFraction === '<35%' || data.ejectionFraction === 'non-visualized')) {
      result.category = 'RED';
      result.redFlags.push('胆囊壁显著增厚伴反复疼痛及功能严重受损');
    }

    if (result.category === 'RED') {
      return result;
    }

    if (data.ejectionFraction === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('缺少胆囊排空功能（EF）检查结果');
    }

    if (data.cbdStatus === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('胆总管状态不明确');
    }

    if (data.labsObstruction === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('缺少近期肝功能及胆道相关化验结果');
    }

    if (data.neckImpaction === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('胆囊颈部嵌顿情况不明确');
    }

    if (data.porcelain === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('胆囊壁钙化情况不明确');
    }

    if (data.liverDisease === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('慢性肝病情况不明确');
    }

    if (data.diabetes === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('糖尿病情况不明确');
    }

    if (data.hyperlipidemia === 'unknown') {
      result.category = 'YELLOW';
      result.yellowFlags.push('高脂血症/代谢情况不明确');
    }

    if (data.wallThickness === '4-5mm') {
      result.category = 'YELLOW';
      result.yellowFlags.push('胆囊壁厚度处于临界范围（4-5mm）');
    }

    if (data.stoneSize === '>20mm') {
      result.category = 'YELLOW';
      result.yellowFlags.push('结石直径较大（>20mm）');
    }

    if (data.diabetes === 'poorly-controlled') {
      result.category = 'YELLOW';
      result.yellowFlags.push('糖尿病控制不佳或有并发症');
    }

    if (data.liverDisease === 'decompensated') {
      result.category = 'YELLOW';
      result.yellowFlags.push('肝病失代偿或近期不稳定');
    }

    if (data.stoneNumber === 'multiple') {
      result.category = 'YELLOW';
      result.yellowFlags.push('多发结石，保胆术后复发风险及手术难度较高');
    }

    if (data.mainFinding === 'polyp' && (data.stoneSize === '11-20mm' || data.stoneSize === '>20mm')) {
      result.category = 'YELLOW';
      result.yellowFlags.push('息肉直径≥10mm，需排除恶变可能性');
    }

    if (data.mainFinding === 'stones' && data.stoneSize === '<=5mm' && data.stoneNumber === 'multiple') {
      result.category = 'YELLOW';
      result.yellowFlags.push('多发小结石存在迁移入胆总管风险');
    }

    if (result.category === 'YELLOW') {
      return result;
    }

    if (data.ejectionFraction === '35-49%') {
      result.isBorderline = true;
    }

    if (data.pregnancy === 'yes') {
      result.modifiers.push({
        type: 'pregnancy',
        message: '建议孕前完成专科评估与风险分层。如选择保胆治疗，应在孕前完成并密切随访，避免孕期症状发作增加母婴风险。'
      });
    }

    if (data.liverDisease === 'stable') {
      result.modifiers.push({
        type: 'liver',
        message: '存在稳定期慢性肝病，建议术前完善肝功能、凝血功能及血小板检查，并由肝病专科医生协同评估手术耐受性。'
      });
    }

    if (data.hyperlipidemia === 'yes') {
      result.modifiers.push({
        type: 'hyperlipidemia',
        message: '存在高脂血症/代谢综合征，术后复发风险可能增加，建议加强生活方式调整及血脂管理，定期复查。'
      });
    }

    return result;
  }

  function displayResult(result) {
    let html = '';

    let titleClass = 'result-title ';
    let titleText = '';
    let meaningText = '';

    if (result.category === 'RED') {
      titleClass += 'result-red';
      titleText = '结论：红灯 🔴';
      meaningText = '初步评估提示存在高风险因素，可能涉及急性炎症、胆道梗阻、胆囊功能严重受损或其他需要紧急处理的情况。建议尽快就诊，由专科医生进行全面评估后确定适合的治疗方案。';
    } else if (result.category === 'YELLOW') {
      titleClass += 'result-yellow';
      titleText = '结论：黄灯 🟡';
      meaningText = '初步评估显示信息不完整或存在需要进一步明确的风险因素。建议补充相关检查后，由专科医生综合判断是否适合保胆治疗。';
    } else {
      if (result.isBorderline) {
        titleClass += 'result-green-borderline';
        titleText = '结论：绿灯（边界）🟢';
        meaningText = '初步评估显示暂无明显禁忌因素，但胆囊功能处于临界水平。建议与专科医生详细讨论保胆治疗的利弊、复发风险及长期随访要求后，再做决策。';
      } else {
        titleClass += 'result-green';
        titleText = '结论：绿灯 🟢';
        meaningText = '初步评估显示暂无明显禁忌因素，可考虑咨询保胆治疗。最终是否适合仍需由专科医生结合完整检查资料及面诊后判断。';
      }
    }

    html += `<div class="${titleClass}">${titleText}</div>`;
    html += '<div class="result-content">';
    html += `<h3>这意味着什么？</h3>`;
    html += `<p>${meaningText}</p>`;

    if (result.category === 'RED' && result.redFlags.length > 0) {
      html += '<h3>发现的高风险因素：</h3>';
      html += '<ul>';
      result.redFlags.forEach(flag => {
        html += `<li>${flag}</li>`;
      });
      html += '</ul>';
    }

    if (result.category === 'YELLOW' && result.yellowFlags.length > 0) {
      html += '<h3>需要补充或明确的项目：</h3>';
      html += '<ul>';
      result.yellowFlags.forEach(flag => {
        html += `<li>${flag}</li>`;
      });
      html += '</ul>';
    }

    if (result.modifiers.length > 0) {
      result.modifiers.forEach(modifier => {
        html += `<div class="modifier-note"><strong>注意：</strong> ${modifier.message}</div>`;
      });
    }

    if (result.incompleteItems && result.incompleteItems.length > 0) {
      html += '<h3>建议补齐的关键信息/检查：</h3>';
      html += '<ul>';
      result.incompleteItems.forEach(item => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
    }

    html += '<h3>建议的下一步：</h3>';
    html += '<ul>';

    if (result.category === 'RED') {
      html += '<li>建议在1-3日内前往医院急诊科或肝胆外科门诊就诊</li>';
      html += '<li>就诊时携带已有的所有检查资料（超声报告、CT/MRI、化验单等）</li>';
      html += '<li>请专科医生进行全面评估，判断是否需要紧急处理</li>';
      html += '<li>根据医生的综合判断选择合适的治疗方案</li>';
    } else if (result.category === 'YELLOW') {
      html += '<li>预约肝胆外科或消化内科专科门诊进行面诊</li>';
      html += '<li>按医生要求补充必要的检查（如胆囊功能测定、复查超声、肝功能等）</li>';
      html += '<li>携带完整检查资料复诊，请医生综合评估保胆治疗的适用性</li>';
      html += '<li>如信息补充后仍不适合保胆，可考虑其他治疗方式</li>';
    } else {
      html += '<li>预约有保胆治疗经验的肝胆外科专科医生面诊</li>';
      html += '<li>携带所有影像学资料及化验报告供医生参考</li>';
      html += '<li>详细了解保胆治疗的适应症、手术方式、术后复发率及随访要求</li>';
      html += '<li>与医生充分讨论个体化治疗方案的利弊</li>';
      html += '<li>如医生评估后认为不适合保胆，可考虑传统胆囊切除术等其他方案</li>';
    }

    html += '</ul>';

    html += '<h3>出现以下情况请立即就医：</h3>';
    html += '<ul>';
    html += '<li>剧烈持续性腹痛超过6小时</li>';
    html += '<li>发热（体温≥38°C）或反复寒战</li>';
    html += '<li>皮肤或眼睛发黄（黄疸）</li>';
    html += '<li>尿色明显加深如浓茶色</li>';
    html += '<li>频繁呕吐、无法进食进水</li>';
    html += '<li>腹部压痛明显或腹肌紧张</li>';
    html += '<li>意识模糊或精神状态明显改变</li>';
    html += '</ul>';

    html += '</div>';

    resultContent.innerHTML = html;
  }

  function generatePlainTextResult(result) {
    let text = '保胆手术适应性初步评估结果\n\n';

    // 1. Conclusion
    text += '【结论】\n';
    if (result.category === 'RED') {
      text += '红灯 - 初步评估提示存在高风险因素，建议尽快就诊由专科医生全面评估。\n\n';
    } else if (result.category === 'YELLOW') {
      text += '黄灯 - 初步评估显示信息不完整或存在需要进一步明确的风险因素。\n\n';
    } else {
      if (result.isBorderline) {
        text += '绿灯（边界）- 初步评估显示暂无明显禁忌因素，但胆囊功能处于临界水平。\n\n';
      } else {
        text += '绿灯 - 初步评估显示暂无明显禁忌因素，可考虑咨询保胆治疗。\n\n';
      }
    }

    // 2. Short summary of key selected answers
    text += '【关键信息摘要】\n';
    const data = result.data;

    const keyInfo = [];

    if (data.biliaryColic !== 'unknown') {
      const painMap = { 'none': '无', 'occasional': '偶有', 'recurrent': '反复发作' };
      keyInfo.push(`疼痛史: ${painMap[data.biliaryColic] || data.biliaryColic}`);
    }

    if (data.fever !== 'unknown') {
      keyInfo.push(`发热: ${data.fever === 'yes' ? '是' : '否'}`);
    }

    if (data.jaundice !== 'unknown') {
      keyInfo.push(`黄疸: ${data.jaundice === 'yes' ? '是' : '否'}`);
    }

    if (data.mainFinding !== 'unknown') {
      const findingMap = {
        'stone-only': '单纯结石',
        'polyp': '息肉',
        'sludge': '胆泥/淤积',
        'no-stone': '无结石'
      };
      keyInfo.push(`超声发现: ${findingMap[data.mainFinding] || data.mainFinding}`);
    }

    if (data.stoneSize !== 'unknown') {
      const sizeMap = {
        '<10mm': '<10mm',
        '11-20mm': '11-20mm',
        '>20mm': '>20mm'
      };
      keyInfo.push(`结石大小: ${sizeMap[data.stoneSize] || data.stoneSize}`);
    }

    if (data.stoneNumber !== 'unknown') {
      const numMap = { 'single': '单发', 'multiple': '多发' };
      keyInfo.push(`结石数量: ${numMap[data.stoneNumber] || data.stoneNumber}`);
    }

    if (data.wallThickness !== 'unknown' && data.wallThickness !== 'not_done') {
      const wallMap = {
        '<3mm': '<3mm（正常）',
        '3-4mm': '3-4mm（正常）',
        '4-5mm': '4-5mm（临界）',
        '>5mm': '>5mm（增厚）'
      };
      keyInfo.push(`胆囊壁: ${wallMap[data.wallThickness] || data.wallThickness}`);
    }

    if (data.ejectionFraction !== 'unknown' && data.ejectionFraction !== 'not_done') {
      const efMap = {
        '≥35%': '≥35%（正常）',
        '35-40%': '35-40%（临界）',
        '<35%': '<35%（功能受损）',
        'non-visualized': '不显影'
      };
      keyInfo.push(`排空分数: ${efMap[data.ejectionFraction] || data.ejectionFraction}`);
    }

    if (data.cbdStatus !== 'unknown') {
      keyInfo.push(`胆总管: ${data.cbdStatus === 'yes' ? '扩张/结石' : '正常'}`);
    }

    if (keyInfo.length > 0) {
      keyInfo.forEach(info => {
        text += `• ${info}\n`;
      });
    } else {
      text += '无关键信息已填写\n';
    }
    text += '\n';

    // 3. Next steps
    text += '【建议的下一步】\n';
    if (result.category === 'RED') {
      text += '• 建议在1-3日内前往医院急诊科或肝胆外科门诊就诊\n';
      text += '• 就诊时携带已有的所有检查资料\n';
      text += '• 请专科医生进行全面评估，判断是否需要紧急处理\n';
      text += '• 根据医生的综合判断选择合适的治疗方案\n\n';
    } else if (result.category === 'YELLOW') {
      text += '• 预约肝胆外科或消化内科专科门诊进行面诊\n';
      text += '• 按医生要求补充必要的检查\n';
      text += '• 携带完整检查资料复诊，请医生综合评估保胆治疗的适用性\n\n';
    } else {
      text += '• 预约有保胆治疗经验的肝胆外科专科医生面诊\n';
      text += '• 携带所有影像学资料及化验报告供医生参考\n';
      text += '• 详细了解保胆治疗的适应症、手术方式、术后复发率及随访要求\n';
      text += '• 与医生充分讨论个体化治疗方案的利弊\n\n';
    }

    // 4. Disclaimer
    text += '【重要声明】\n';
    text += '本工具仅为教育性质的初步风险筛查问卷，不能替代专业医生的临床诊断与决策。所有结果均基于简化规则，不考虑个体差异及完整病史。任何治疗方案的选择，必须由具备资质的外科医生或肝胆专科医师根据完整检查与面诊后决定。\n';

    return text;
  }
});
