import base from '@ceak/config/eslint/base';

export default [...base, { files: ['prisma/seed*.ts'], rules: { 'no-console': 'off' } }];
