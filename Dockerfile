FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Kopiujemy plik projektu z podfolderu repozytorium do /src/
COPY ["backend/GRU_APP.Backend.csproj", "./"]
RUN dotnet restore "GRU_APP.Backend.csproj"

# 2. Kopiujemy całą zawartość folderu backend bezpośrednio do /src/
COPY backend/ .

# 3. Publikujemy aplikację do czystego folderu wyjściowego
RUN dotnet publish "GRU_APP.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# --- Faza Uruchomieniowa ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Kopiujemy skompilowaną aplikację z etapu build
COPY --from=build /app/publish .

# Wymuszenie na .NET 8 słuchania na porcie akceptowanym przez Render
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Czyste uruchomienie procesu bez używania powłoki systemowej (zapobiega błędowi 145)
CMD ["dotnet", "GRU_APP.Backend.dll"]