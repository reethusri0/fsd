// LearnZone Test Runner — Node.js
// Tests the data layer and utility logic of utils.js

const store = {};
const sessionStore = {};

global.localStorage = {
  getItem: k => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.sessionStorage = {
  getItem: k => sessionStore[k] || null,
  setItem: (k, v) => { sessionStore[k] = String(v); },
  removeItem: k => { delete sessionStore[k]; }
};
global.window = {
  matchMedia: () => ({ matches: false }),
  location: { href: '' }
};
global.document = {
  documentElement: {
    classList: { add: () => {}, remove: () => {}, toggle: (cls, f) => f, contains: () => false }
  },
  createElement: (tag) => {
    let _text = '';
    return {
      set textContent(v) { _text = v; },
      get innerHTML() { return String(_text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    };
  },
  body: { appendChild: () => {}, insertBefore: () => {} },
  getElementById: () => null,
  querySelector: () => null
};

// Require utils.js
const {
  DB,
  Theme,
  Toast,
  isValidEmail,
  isValidPhone,
  futureDateISO,
  pastDateISO,
  formatDate,
  relativeTime,
  daysFromToday,
  dueLabel,
  sanitize
} = require('./utils.js');

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log('  ✓', name);
      passed++;
    } else {
      console.error('  ✗', name, '→', result);
      failed++;
    }
  } catch (e) {
    console.error('  ✗', name, '→ THREW:', e.message);
    failed++;
  }
}

console.log('\n── LearnZone Data Layer & Utility Tests ──\n');

// 1. Registration
test('Register new user', () => {
  const r = DB.registerUser({ firstName:'Alice', lastName:'Smith', age:20, dob:'2006-01-01', email:'alice@test.com', phone:'9876543210', password:'SecurePassword1' });
  if (!r.ok) return 'expected ok, got: ' + r.msg;
  return true;
});

test('Duplicate email rejected', () => {
  const r = DB.registerUser({ firstName:'Bob', lastName:'Jones', age:22, dob:'2004-01-01', email:'alice@test.com', phone:'8765432109', password:'SecurePassword2' });
  if (r.ok) return 'expected failure, got ok';
  if (r.error !== 'email') return 'wrong error type: ' + r.error;
  return true;
});

test('Second user registered', () => {
  const r = DB.registerUser({ firstName:'Bob', lastName:'Jones', age:22, dob:'2004-01-01', email:'bob@test.com', phone:'8765432109', password:'SecurePassword2' });
  if (!r.ok) return 'expected ok, got: ' + r.msg;
  return true;
});

// 2. Login
test('Login with correct credentials', () => {
  const l = DB.loginUser('alice@test.com', 'SecurePassword1');
  if (!l.ok) return 'expected ok, got: ' + l.msg;
  if (l.user.firstName !== 'Alice') return 'wrong firstName: ' + l.user.firstName;
  return true;
});

test('Login case-insensitive email', () => {
  const l = DB.loginUser('ALICE@TEST.COM', 'SecurePassword1');
  if (!l.ok) return 'expected ok: ' + l.msg;
  return true;
});

test('Login with wrong password rejected', () => {
  const l = DB.loginUser('alice@test.com', 'wrongpassword');
  if (l.ok) return 'expected failure';
  return true;
});

test('Login non-existent user rejected', () => {
  const l = DB.loginUser('nobody@test.com', 'pass123');
  if (l.ok) return 'expected failure';
  return true;
});

// 3. Session management
test('Session set and retrieved', () => {
  const l = DB.loginUser('alice@test.com', 'SecurePassword1');
  DB.setSession(l.user);
  const retrieved = DB.getSession();
  if (!retrieved) return 'session not stored';
  if (retrieved.firstName !== 'Alice') return 'wrong firstName in session';
  if (retrieved.initials !== 'AS') return 'wrong initials: ' + retrieved.initials;
  return true;
});

test('Session cleared on logout', () => {
  DB.clearSession();
  if (DB.getSession()) return 'session not cleared';
  return true;
});

// 4. Assignments
test('Assignments seeded for new user', () => {
  const a = DB.getAssignments('alice@test.com');
  if (a.length !== 4) return 'expected 4, got: ' + a.length;
  return true;
});

test('Submit assignment changes status', () => {
  DB.submitAssignment('alice@test.com', 'asg_1');
  const a = DB.getAssignments('alice@test.com').find(x => x.id === 'asg_1');
  if (!a) return 'assignment not found';
  if (a.status !== 'submitted') return 'status is: ' + a.status;
  return true;
});

test('Already-submitted has submittedAt timestamp', () => {
  const a = DB.getAssignments('alice@test.com').find(x => x.id === 'asg_1');
  if (!a.submittedAt) return 'no submittedAt';
  return true;
});

test('Submit nonexistent assignment returns false', () => {
  const r = DB.submitAssignment('alice@test.com', 'nonexistent');
  if (r !== false) return 'expected false, got: ' + r;
  return true;
});

// 5. Queries
test('Add query saved', () => {
  const initialCount = DB.getQueries().length;
  const q = DB.addQuery({ title: 'My question', body: 'Question details here', authorEmail: 'alice@test.com', authorName: 'Alice Smith' });
  const all = DB.getQueries();
  if (all.length !== initialCount + 1) return 'expected ' + (initialCount + 1) + ' queries, got: ' + all.length;
  if (all[0].id !== q.id) return 'id mismatch';
  return true;
});

test('Query title is sanitized (XSS prevention)', () => {
  const q = DB.addQuery({ title: '<script>alert("xss")</script>', body: 'safe body', authorEmail: 'alice@test.com', authorName: 'Alice' });
  const stored = DB.getQueries().find(qr => qr.id === q.id);
  if (stored.title.includes('<script>')) return 'XSS not sanitized: ' + stored.title;
  return true;
});

test('Delete own query', () => {
  const q = DB.addQuery({ title: 'To delete', body: 'will be gone', authorEmail: 'alice@test.com', authorName: 'Alice Smith' });
  const r = DB.deleteQuery(q.id, 'alice@test.com');
  if (!r) return 'delete returned false';
  return true;
});

test('Cannot delete another users query', () => {
  const q = DB.addQuery({ title: 'Other users query', body: 'not mine', authorEmail: 'bob@test.com', authorName: 'Bob Jones' });
  const r = DB.deleteQuery(q.id, 'alice@test.com');
  if (r !== false) return 'should not have been able to delete';
  return true;
});

// 6. Validation helpers
test('Valid email accepted', () => !isValidEmail('test@example.com') ? 'false negative' : true);
test('Invalid email rejected (no @)', () => isValidEmail('bademail') ? 'false positive' : true);
test('Invalid email rejected (no domain)', () => isValidEmail('bad@') ? 'false positive' : true);
test('Valid Indian phone (starts 9)', () => !isValidPhone('9876543210') ? 'false negative' : true);
test('Valid Indian phone (starts 6)', () => !isValidPhone('6543210987') ? 'false negative' : true);
test('Invalid phone (starts 1)', () => isValidPhone('1234567890') ? 'false positive' : true);
test('Invalid phone (too short)', () => isValidPhone('987654321') ? 'false positive' : true);
test('Invalid phone (11 digits)', () => isValidPhone('98765432100') ? 'false positive' : true);

// 7. Date utilities
test('futureDateISO returns future date', () => {
  const d = new Date(futureDateISO(5));
  const today = new Date();
  today.setHours(0,0,0,0);
  if (d <= today) return 'not in the future: ' + futureDateISO(5);
  return true;
});

test('pastDateISO returns past date', () => {
  const d = new Date(pastDateISO(3));
  const today = new Date();
  today.setHours(0,0,0,0);
  if (d >= today) return 'not in the past: ' + pastDateISO(3);
  return true;
});

test('dueLabel future 5 days', () => {
  const label = dueLabel(futureDateISO(5));
  if (!label.includes('5 days')) return 'unexpected: ' + label;
  return true;
});

test('dueLabel overdue 3 days', () => {
  const label = dueLabel(pastDateISO(3));
  if (!label.includes('overdue')) return 'unexpected: ' + label;
  return true;
});

test('dueLabel today', () => {
  const today = new Date().toISOString().split('T')[0];
  const label = dueLabel(today);
  if (!label.includes('today')) return 'unexpected: ' + label;
  return true;
});

// ─── Summary ─────────────────────────────────────────────────
console.log('');
console.log(`──────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('All tests passed. ✓\n');
  process.exit(0);
} else {
  console.log('Some tests failed. ✗\n');
  process.exit(1);
}
