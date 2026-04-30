const currentEl = document.getElementById('current');
const historyEl = document.getElementById('history');

const state = {
  current: '0',
  previous: null,
  operator: null,
  waitingForNew: false,
};

const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' };

function format(num) {
  if (num === 'Error') return num;
  const n = Number(num);
  if (!isFinite(n)) return 'Error';
  // limit to 12 significant digits, strip trailing zeros
  let str = parseFloat(n.toPrecision(12)).toString();
  // add thousands separators on integer part if no exponent
  if (!str.includes('e') && Math.abs(n) < 1e15) {
    const [intPart, decPart] = str.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    str = decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  }
  return str;
}

function render() {
  currentEl.textContent = format(state.current);
  if (state.previous !== null && state.operator) {
    historyEl.textContent = `${format(state.previous)} ${opSymbol[state.operator]}`;
  } else {
    historyEl.textContent = '';
  }
}

function flash() {
  currentEl.classList.remove('flash');
  void currentEl.offsetWidth;
  currentEl.classList.add('flash');
}

function inputDigit(d) {
  if (state.current === 'Error') resetAll();
  if (state.waitingForNew) {
    state.current = d;
    state.waitingForNew = false;
  } else {
    state.current = state.current === '0' ? d : state.current + d;
  }
  render();
}

function inputDecimal() {
  if (state.current === 'Error') resetAll();
  if (state.waitingForNew) {
    state.current = '0.';
    state.waitingForNew = false;
    render();
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
    render();
  }
}

function setActiveOperator(op) {
  document.querySelectorAll('button.operator').forEach(b => b.classList.remove('active'));
  if (op) {
    const btn = document.querySelector(`button[data-op="${op}"]`);
    if (btn) btn.classList.add('active');
  }
}

function chooseOperator(op) {
  if (state.current === 'Error') return;
  if (state.operator && !state.waitingForNew) {
    compute();
  }
  state.previous = state.current;
  state.operator = op;
  state.waitingForNew = true;
  setActiveOperator(op);
  render();
}

function compute() {
  if (state.operator === null || state.previous === null) return;
  const a = parseFloat(state.previous);
  const b = parseFloat(state.current);
  let result;
  switch (state.operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/':
      if (b === 0) {
        state.current = 'Error';
        state.previous = null;
        state.operator = null;
        setActiveOperator(null);
        render();
        return;
      }
      result = a / b;
      break;
  }
  state.current = String(result);
  state.previous = null;
  state.operator = null;
  state.waitingForNew = true;
  setActiveOperator(null);
  flash();
  render();
}

function negate() {
  if (state.current === 'Error' || state.current === '0') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  render();
}

function percent() {
  if (state.current === 'Error') return;
  state.current = String(parseFloat(state.current) / 100);
  render();
}

function resetAll() {
  state.current = '0';
  state.previous = null;
  state.operator = null;
  state.waitingForNew = false;
  setActiveOperator(null);
  render();
}

// Click
document.querySelector('.keys').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.dataset.num !== undefined) inputDigit(btn.dataset.num);
  else if (btn.dataset.op) chooseOperator(btn.dataset.op);
  else if (btn.dataset.action === 'decimal') inputDecimal();
  else if (btn.dataset.action === 'equals') compute();
  else if (btn.dataset.action === 'clear') resetAll();
  else if (btn.dataset.action === 'negate') negate();
  else if (btn.dataset.action === 'percent') percent();
});

// keyboard
document.addEventListener('keydown', (e) => {
  const k = e.key;
  if (/^[0-9]$/.test(k)) inputDigit(k);
  else if (k === '.') inputDecimal();
  else if (['+', '-', '*', '/'].includes(k)) chooseOperator(k);
  else if (k === 'Enter' || k === '=') { e.preventDefault(); compute(); }
  else if (k === 'Escape' || k === 'c' || k === 'C') resetAll();
  else if (k === '%') percent();
  else if (k === 'Backspace') {
    if (state.current === 'Error') return resetAll();
    if (state.waitingForNew) return;
    state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
    render();
  }
});

render();
