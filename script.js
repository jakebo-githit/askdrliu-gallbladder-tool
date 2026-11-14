document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('assessmentForm');
  if (!form) return;
  const resultSection = document.getElementById('resultSection');
  const resultContent = document.getElementById('resultContent');
  const copyBtn = document.getElementById('copyBtn');
  let summary = '';
  const scope = '摘要只复述您填写的信息，不能确定诊断、判断手术适合性或排除急症。治疗选择需与自己的医生讨论。';
  const urgent = '如有严重、持续或加重的腹痛、发热或寒战、黄疸、反复呕吐或无法饮水，请及时就医；情况严重时立即联系当地急救服务，不要等待问卷结果。';

  function reset() {
    form.reset();
    form.style.display = '';
    resultSection.style.display = 'none';
    resultContent.replaceChildren();
    summary = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('newAssessmentBtn').addEventListener('click', reset);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const answers = Array.from(form.querySelectorAll('select')).map(select => {
      const label = document.querySelector('label[for="' + select.id + '"]').textContent.trim();
      return label + ' ' + select.options[select.selectedIndex].textContent.trim();
    });
    const heading = document.createElement('h2');
    heading.className = 'result-title';
    heading.textContent = '就诊信息摘要';
    const content = document.createElement('div');
    content.className = 'result-content';
    const notice = document.createElement('p');
    notice.textContent = scope;
    const warning = document.createElement('p');
    warning.textContent = urgent;
    const list = document.createElement('ul');
    for (const answer of answers) {
      const li = document.createElement('li');
      li.textContent = answer;
      list.appendChild(li);
    }
    content.append(notice, warning, list);
    resultContent.replaceChildren(heading, content);
    summary = ['胆结石就诊信息摘要', scope, urgent, ...answers].join('\n');
    form.style.display = 'none';
    resultSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  copyBtn.addEventListener('click', async function () {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      copyBtn.textContent = '✓ 已复制';
      setTimeout(() => { copyBtn.textContent = '复制结果'; }, 2000);
    } catch {
      alert('复制失败，请手动复制摘要文本');
    }
  });
});
