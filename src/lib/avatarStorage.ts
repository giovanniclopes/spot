import { supabase } from "./supabase";

export const uploadAvatar = async (
  userId: string,
  file: Blob
): Promise<string> => {
  const fileName = `${userId}.webp`;
  const filePath = `${userId}/${fileName}`;

  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove([`${userId}/${existingFiles[0].name}`]);
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erro no upload: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  await updateProfileAvatar(userId, publicUrl);

  return publicUrl;
};

export const deleteAvatar = async (userId: string): Promise<void> => {
  const { data: files } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${userId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove(filePaths);

    if (deleteError) {
      throw new Error(`Erro ao remover arquivo: ${deleteError.message}`);
    }
  }

  await updateProfileAvatar(userId, null);
};

export const updateProfileAvatar = async (
  userId: string,
  avatarUrl: string | null
): Promise<void> => {
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`);
  }
};

export const getAvatarUrl = (userId: string): string | null => {
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(`${userId}/${userId}.webp`);

  return publicUrl;
};

