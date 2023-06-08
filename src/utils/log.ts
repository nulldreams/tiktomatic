import colors from 'colors'
const log = console.log

export const info = (text: string) => log('💬 ' + colors.blue(text))
export const success = (text: string) => log(colors.green('✅ ' + text))
export const error = (text: string) => log('⛔ ' + colors.red(text))
