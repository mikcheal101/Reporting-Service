import { QueryParameterDto } from 'src/reports/dto/query-parameter.dto';
import { DatabaseDatatype } from '../models/database.datatypes.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseUtils {
  public mapDbParameters = (params: QueryParameterDto[]) => {
    return params.reduce(
      (acc, p) => {
        const name = p.name.replace(/^@/, '');
        switch (p.dataType.toUpperCase()) {
          case DatabaseDatatype.BOOLEAN:
            acc[name] = {
              type: DatabaseDatatype.BOOLEAN,
              value: p.value === 'true',
            };
            break;

          case DatabaseDatatype.DATE:
            acc[name] = {
              type: DatabaseDatatype.DATE,
              value: new Date(p.value),
            };
            break;

          case DatabaseDatatype.NUMBER:
            acc[name] = {
              type: DatabaseDatatype.NUMBER,
              value: Number(p.value),
            };
            break;

          case DatabaseDatatype.STRING:
          default:
            acc[name] = {
              type: DatabaseDatatype.STRING,
              value: String(p.value),
            };
            break;
        }
        return acc;
      },
      {} as Record<string, { type: DatabaseDatatype; value: any }>,
    );
  }
}
