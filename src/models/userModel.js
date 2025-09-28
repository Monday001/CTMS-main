import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const User = {
  findAll: async () => {
    return await prisma.user.findMany({
      include: { student: true, lecturer: true },
    });
  },

  findById: async (id) => {
    return await prisma.user.findUnique({
      where: { id },
      include: { student: true, lecturer: true },
    });
  },

  findByEmail: async (email) => {
    return await prisma.user.findUnique({
      where: { email },
      include: { student: true, lecturer: true },
    });
  },

  create: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: { student: true, lecturer: true },
    });
  },

  update: async (id, data) => {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return await prisma.user.update({
      where: { id },
      data,
      include: { student: true, lecturer: true },
    });
  },

  delete: async (id) => {
    return await prisma.user.delete({
      where: { id },
    });
  },
};

export default User;
