import prisma from "@/lib/prisma";

const Lecturer = {
  findAll: async () => {
    return await prisma.lecturer.findMany({
      include: { user: true },
    });
  },

  findById: async (id) => {
    return await prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  create: async (userId, data) => {
    return await prisma.lecturer.create({
      data: {
        userId,
        ...data,
      },
      include: { user: true },
    });
  },

  update: async (id, data) => {
    return await prisma.lecturer.update({
      where: { id },
      data,
      include: { user: true },
    });
  },

  delete: async (id) => {
    return await prisma.lecturer.delete({
      where: { id },
    });
  },
};

export default Lecturer;
