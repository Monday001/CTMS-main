import prisma from "@/lib/prisma";

const Student = {
  findAll: async () => {
    return await prisma.student.findMany({
      include: { user: true },
    });
  },

  findById: async (id) => {
    return await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  create: async (userId, data) => {
    return await prisma.student.create({
      data: {
        userId,
        ...data,
      },
      include: { user: true },
    });
  },

  update: async (id, data) => {
    return await prisma.student.update({
      where: { id },
      data,
      include: { user: true },
    });
  },

  delete: async (id) => {
    return await prisma.student.delete({
      where: { id },
    });
  },
};

export default Student;
