import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  TranscriptSettingsPayload,
  TranscriptsettingsSchema,
} from "@/lib/form-schemas/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

const SettingForm: React.FC = () => {
  const [storedFormData, setStoredFormData] =
    useLocalStorage<TranscriptSettingsPayload>("settings", {
      referenceNumber: "",
      nameFrench: "",
      nameEnglish: "",
      postalBox: "",
      email: "",
      logo: "",
    });

  const form = useForm<TranscriptSettingsPayload>({
    resolver: zodResolver(TranscriptsettingsSchema),
    defaultValues: storedFormData,
  });

  const MAX_FILE_SIZE = 1000 * 1024; 

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
  
      
      if (file.size > MAX_FILE_SIZE) {
        form.setError("logo", {
          type: "manual",
          message: "L'image dépasse la taille maximale autorisée (1Mb).",
        });
        return;
      }
  
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        form.clearErrors("logo"); 
        form.setValue("logo", base64); 
        setStoredFormData((prev) => ({ ...prev, logo: base64 })); 
      };
      reader.readAsDataURL(file);
    },
    [form, setStoredFormData]
  );
  

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  return (
    <Card className="w-full max-w-3xl mx-auto my-10">
      <CardHeader>
        <CardTitle>Formulaire de Paramètres</CardTitle>
        <CardDescription>
          Les données sont sauvegardées automatiquement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="grid grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de Référence</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setStoredFormData((prev) => ({
                            ...prev,
                            referenceNumber: e.target.value,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameFrench"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom en Français</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setStoredFormData((prev) => ({
                            ...prev,
                            nameFrench: e.target.value,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEnglish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom en Anglais</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setStoredFormData((prev) => ({
                            ...prev,
                            nameEnglish: e.target.value,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalBox"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boîte Postale</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setStoredFormData((prev) => ({
                            ...prev,
                            postalBox: e.target.value,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse E-mail</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        onChange={(e) => {
                          field.onChange(e);
                          setStoredFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem className="h-full">
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer flex flex-col justify-center ${
                        isDragActive ? "border-primary" : "border-gray-300"
                      }`}
                    >
                      <input {...getInputProps()} />
                      {field.value ? (
                        <img
                          src={field.value}
                          alt="Logo"
                          className="mx-auto max-h-40 w-full object-contain"
                        />
                      ) : isDragActive ? (
                        <p>Déposez le fichier ici ...</p>
                      ) : (
                        <p>
                          Faites glisser et déposez un logo ici, ou cliquez pour
                          sélectionner un fichier
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SettingForm;
