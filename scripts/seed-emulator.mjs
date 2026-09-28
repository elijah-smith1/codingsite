// REST writes are intentionally fixed to localhost and a non-production demo project.
const root = 'http://127.0.0.1:8080/v1/projects/demo-codebloom/databases/(default)/documents'
const titles = ['Running JavaScript and console output', 'Variables with let and const', 'Data types and operators', 'Strings and template literals', 'Comparisons and conditionals', 'Functions, parameters, and returns', 'Arrays', 'Objects', 'Loops', 'Array methods', 'Scope, errors, and debugging', 'Selecting and updating the DOM', 'Events', 'Forms and validation', 'JSON and browser storage', 'Promises, async/await, and fetch', 'Modules and organizing code', 'Final project: learning tracker']
const lessons = titles.map((title, index) => ({ id: index === 0 ? 'hello-javascript' : `lesson-${String(index + 1).padStart(2, '0')}`, title }))
function field(value) {
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'number') return { integerValue: String(value) }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(field) } }
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, field(item)])) } }
}
async function write(path, data) {
  const response = await fetch(`${root}/${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify(field(data).mapValue) })
  if (!response.ok) throw new Error(`Could not seed ${path}: ${response.status} ${await response.text()}`)
}
await write('courses/javascript', { title: 'Think in JavaScript', description: 'Learn one small idea, try it, and build something yours.', lessons, version: 1 })
await write('courses/javascript/lessons/hello-javascript', { title: 'Hello, JavaScript.', objective: 'Understand how JavaScript runs an instruction and prints a message.', explanation: 'JavaScript gives a computer instructions. The console is a place to see messages from your program. console.log() prints the value inside its parentheses. Text goes inside quotes. In this example, the program prints a friendly greeting.', example: 'const greeting = "Hello, builder!";\nconsole.log(greeting);', version: 1 })
console.log('Seeded the local demo-codebloom course and sample lesson. No cloud project was contacted.')
