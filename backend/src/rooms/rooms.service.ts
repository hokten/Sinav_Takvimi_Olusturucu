import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll() { 
    return this.prisma.room.findMany({ orderBy: { name: 'asc' } }); 
  }
  
  async create(data: { name: string, capacity: number }) { 
    return this.prisma.room.create({ data }); 
  }
  
  async update(id: string, data: { name: string, capacity: number }) { 
    return this.prisma.room.update({ where: { id }, data }); 
  }
  
  async remove(id: string) { 
    return this.prisma.room.delete({ where: { id } }); 
  }
}
