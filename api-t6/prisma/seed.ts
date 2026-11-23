import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type ElevatorStatus, type ElevatorType, type Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Datos demo. Idempotente: usa upsert por los campos únicos (name e internalCode),
// así que se puede correr muchas veces sin duplicar nada.
const edificios = [
  { name: 'Torre Central', address: 'Cra. 7 # 32-16', city: 'Bogotá', floors: 18 },
  { name: 'Edificio Andino', address: 'Calle 82 # 11-37', city: 'Bogotá', floors: 12 },
  { name: 'Clínica del Norte', address: 'Calle 34 # 43-66', city: 'Medellín', floors: 6 },
  { name: 'Centro Logístico Sur', address: 'Autopista Sur # 66-80', city: 'Cali', floors: 3 },
];

const ascensores: {
  internalCode: string; brand: string; model: string; type: ElevatorType; capacityKg: number;
  stops: number; status: ElevatorStatus; installedAt: string; edificio: string;
}[] = [
  { internalCode: 'ASC-001', brand: 'Otis', model: 'Gen2', type: 'ELECTRICO', capacityKg: 630, stops: 18, status: 'ACTIVO', installedAt: '2019-03-15', edificio: 'Torre Central' },
  { internalCode: 'ASC-002', brand: 'Schindler', model: '3300', type: 'ELECTRICO', capacityKg: 800, stops: 18, status: 'ACTIVO', installedAt: '2019-03-15', edificio: 'Torre Central' },
  { internalCode: 'ASC-003', brand: 'Kone', model: 'MonoSpace 500', type: 'ELECTRICO', capacityKg: 1000, stops: 12, status: 'EN_MANTENIMIENTO', installedAt: '2016-08-01', edificio: 'Edificio Andino' },
  { internalCode: 'ASC-004', brand: 'Schindler', model: '7000 Panorama', type: 'PANORAMICO', capacityKg: 1050, stops: 12, status: 'ACTIVO', installedAt: '2021-11-20', edificio: 'Edificio Andino' },
  { internalCode: 'ASC-005', brand: 'ThyssenKrupp', model: 'Synergy', type: 'HIDRAULICO', capacityKg: 450, stops: 6, status: 'ACTIVO', installedAt: '2014-05-10', edificio: 'Clínica del Norte' },
  { internalCode: 'ASC-006', brand: 'Orona', model: '3G 1010', type: 'HIDRAULICO', capacityKg: 1600, stops: 6, status: 'FUERA_DE_SERVICIO', installedAt: '2012-02-28', edificio: 'Clínica del Norte' },
  { internalCode: 'ASC-007', brand: 'Otis', model: 'Gen2 Freight', type: 'MONTACARGAS', capacityKg: 2500, stops: 3, status: 'ACTIVO', installedAt: '2020-07-07', edificio: 'Centro Logístico Sur' },
  { internalCode: 'ASC-008', brand: 'Mitsubishi', model: 'Freight F2', type: 'MONTACARGAS', capacityKg: 2000, stops: 3, status: 'ACTIVO', installedAt: '2022-01-18', edificio: 'Centro Logístico Sur' },
];

async function main(): Promise<void> {
  console.log('🌱 Seed de LiftSafe (4.° backend, T6)');

  const idPorNombre = new Map<string, string>();
  for (const e of edificios) {
    const edificio = await prisma.building.upsert({ where: { name: e.name }, update: e, create: e });
    idPorNombre.set(edificio.name, edificio.id);
  }
  console.log(`   🏢 Edificios: ${edificios.length} listos`);

  for (const { edificio, installedAt, ...a } of ascensores) {
    const datos = { ...a, installedAt: new Date(installedAt), buildingId: idPorNombre.get(edificio)! };
    await prisma.elevator.upsert({ where: { internalCode: a.internalCode }, update: datos, create: datos });
  }
  console.log(`   🛗 Ascensores: ${ascensores.length} listos`);

  // Usuarios que pueden pedir un token. La contraseña sale de SEED_PASSWORD (.env).
  const clave = process.env.SEED_PASSWORD ?? 'LiftSafe2026!';
  const passwordHash = await bcrypt.hash(clave, 10);
  const usuarios: { email: string; name: string; role: Role }[] = [
    { email: 'admin@liftsafe.test', name: 'Administrador API', role: 'ADMIN' },
    { email: 'integrador@liftsafe.test', name: 'App móvil / integración', role: 'INTEGRADOR' },
  ];
  for (const u of usuarios) {
    await prisma.user.upsert({ where: { email: u.email }, update: { ...u, passwordHash }, create: { ...u, passwordHash } });
  }
  console.log(`   🔑 Usuarios: ${usuarios.map((u) => `${u.email} (${u.role})`).join(', ')}`);

  const [totalEdificios, totalAscensores] = await Promise.all([prisma.building.count(), prisma.elevator.count()]);
  console.log(`✅ En la base: ${totalEdificios} edificios y ${totalAscensores} ascensores`);
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
