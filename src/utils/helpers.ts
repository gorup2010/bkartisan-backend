import bcrypt from 'bcryptjs';

export function hashPassword(password: any) {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(raw: any, hash: any) {
  return bcrypt.compareSync(raw, hash);
}

export function getCurrentDate() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function addDays(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}